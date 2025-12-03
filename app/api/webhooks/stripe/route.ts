export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import type Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { isAllowedZip, normalizeZip } from "@/lib/allowed-zips"

function reqEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env ${name}`)
  return v
}

// Lazy initialization of Supabase client
let supabaseAdmin: ReturnType<typeof createClient> | null = null

const getSupabaseAdmin = () => {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      reqEnv("SUPABASE_URL"),
      reqEnv("SUPABASE_SERVICE_ROLE_KEY"), // service role to bypass RLS
    )
  }
  return supabaseAdmin
}

// Helper function for resolving plan ID from price
async function resolvePlanIdFromPrice(stripePriceId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("product_prices")
    .select("plan_id")
    .eq("stripe_price_id", stripePriceId)
    .maybeSingle()
  return error ? null : (data?.plan_id ?? null)
}

// Helper function to map Stripe interval to our billing_cycle constraint values
function mapStripeIntervalToBillingCycle(stripeInterval: string | undefined): string {
  if (!stripeInterval) return "monthly"
  
  const mapping: Record<string, string> = {
    'day': 'day',
    'week': 'weekly', 
    'month': 'monthly',
    'quarter': 'quarterly',
    'year': 'yearly'
  }
  
  return mapping[stripeInterval] || "monthly"
}

// Helper function for upserting subscription from IDs
async function upsertSubscriptionFromIds({
  subscriptionId,
  session,
}: { subscriptionId: string; session: Stripe.Checkout.Session }) {
  console.log("[v0] Upserting subscription from IDs:", subscriptionId)

  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)

    const planId = session.metadata?.plan_id || session.client_reference_id || null

    // Get user_id from the plan if not available in session metadata
    let userId = session.metadata?.user_id
    if (!userId && planId) {
      const { data: planData } = await getSupabaseAdmin()
        .from("plans")
        .select("user_id")
        .eq("id", planId)
        .single()
      userId = planData?.user_id
    }

    // Skip subscription creation if we don't have a user_id
    if (!userId) {
      console.log("[v0] Skipping subscription creation - no user_id found for plan:", planId)
      return
    }

    // Determine status: Stripe keeps status as "active" when using pause_collection
    // So we need to check pause_collection to detect paused subscriptions
    let subscriptionStatus = stripeSubscription.status
    if (stripeSubscription.pause_collection && stripeSubscription.pause_collection.behavior) {
      subscriptionStatus = 'paused'
    }

    // Build metadata - for topper subscriptions, include dog info from session metadata
    const metadata: any = {
      checkout_session_id: session.id,
      stripe_customer_id: session.customer as string,
    }

    // Add plan_id if it exists (will be null for topper subscriptions)
    if (planId) {
      metadata.plan_id = planId
    }

    // For topper subscriptions, include dog and product info from session metadata
    if (session.metadata?.dog_id) {
      metadata.dog_id = session.metadata.dog_id
    }
    if (session.metadata?.dog_name) {
      metadata.dog_name = session.metadata.dog_name
    }
    if (session.metadata?.dog_size) {
      metadata.dog_size = session.metadata.dog_size
    }
    if (session.metadata?.product_type) {
      metadata.product_type = session.metadata.product_type
    }

    // Capture delivery zipcode from shipping address
    const shippingZip = session.shipping_details?.address?.postal_code ||
                       session.customer_details?.address?.postal_code
    if (shippingZip) {
      metadata.delivery_zipcode = shippingZip
    }

    const subscriptionData = {
      user_id: userId,
      plan_id: planId, // Will be NULL for topper subscriptions
      stripe_subscription_id: subscriptionId,
      status: subscriptionStatus,
      current_period_start: stripeSubscription.current_period_start ? new Date(stripeSubscription.current_period_start * 1000).toISOString() : new Date().toISOString(),
      current_period_end: stripeSubscription.current_period_end ? new Date(stripeSubscription.current_period_end * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      currency: stripeSubscription.currency,
      interval: stripeSubscription.items.data[0]?.price.recurring?.interval || "month",
      interval_count: stripeSubscription.items.data[0]?.price.recurring?.interval_count || 1,
        billing_cycle: mapStripeIntervalToBillingCycle(stripeSubscription.items.data[0]?.price.recurring?.interval) || "monthly",
      stripe_price_id: stripeSubscription.items.data[0]?.price.id || null,
      cancel_at_period_end: stripeSubscription.cancel_at_period_end || false,
      canceled_at: stripeSubscription.canceled_at
        ? new Date(stripeSubscription.canceled_at * 1000).toISOString()
        : null,
      default_payment_method_id: (stripeSubscription.default_payment_method as string) || null,
      metadata: metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("[v0] Attempting to upsert subscription with data:", JSON.stringify(subscriptionData, null, 2))

    const { error: subError } = await getSupabaseAdmin().from("subscriptions").upsert(subscriptionData, {
      onConflict: "stripe_subscription_id",
      ignoreDuplicates: false,
    })

    if (subError) {
      console.error("[v0] Failed to upsert subscription:", subError)
      console.error("[v0] Subscription data that failed:", JSON.stringify(subscriptionData, null, 2))
      // Don't throw error in webhook - just log it to avoid breaking the webhook flow
      return
    } else {
      console.log("[v0] Subscription upserted successfully")
    }
  } catch (error) {
    console.error("[v0] Error upserting subscription:", error)
  }
}

export async function POST(req: Request) {
  // Debug: visibility on mode/headers
  console.log("[diag] header(sig)?", !!req.headers.get("stripe-signature"))
  console.log("[diag] key mode:", (process.env.STRIPE_SECRET_KEY || "").startsWith("sk_live_") ? "LIVE" : "TEST")
  console.log("[diag] wh secret present?", !!process.env.STRIPE_WEBHOOK_SECRET)

  console.log("[v0] Webhook received")

  const sig = req.headers.get("stripe-signature")!
  const whSecret = reqEnv("STRIPE_WEBHOOK_SECRET")
  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, whSecret)
    console.log("[v0] Webhook signature verified, event type:", event.type)
  } catch (err: any) {
    console.error("[v0] Webhook signature verification failed:", err.message)
    return new NextResponse(`Webhook error: ${err.message}`, { status: 400 })
  }

  // Persist raw event
  try {
    await getSupabaseAdmin().from("stripe_events").insert({
      id: event.id,
      type: event.type,
      payload: event as any,
    })
    console.log("[v0] Event persisted to stripe_events table")
  } catch (error) {
    console.error("[v0] Failed to persist event:", error)
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session
      console.log("[v0] Processing checkout.session.completed:", s.id)

      // ZIP validation safety net - check if shipping address is in allowed zones
      const shippingZip = 
        (s.shipping_details?.address?.postal_code && normalizeZip(s.shipping_details.address.postal_code)) ||
        "";

      // Fall back to billing postal code if needed
      const billingZip = normalizeZip((s.customer_details?.address?.postal_code as string) || "");

      const finalZip = shippingZip || billingZip;
      if (finalZip && !isAllowedZip(finalZip)) {
        console.warn("[v0] Out-of-zone order detected:", finalZip, s.id);
        // Log the out-of-zone order for manual follow-up
        // In production, you might want to:
        // 1. Send an alert to your team
        // 2. Auto-refund if it's a one-time payment
        // 3. Cancel subscription if it's a recurring payment
        // 4. Flag the order for manual review
      }

      let subscriptionId = s.subscription as string | null

      if (!subscriptionId) {
        // occasional race: fetch the session with expansion to give Stripe a moment
        try {
          const fresher = await stripe.checkout.sessions.retrieve(s.id, { expand: ["subscription"] })
          subscriptionId =
            ((fresher.subscription as Stripe.Subscription | string | null) &&
              (typeof fresher.subscription === "string" ? fresher.subscription : fresher.subscription?.id)) ||
            null
        } catch (e) {
          console.warn("[webhook] expand fetch failed", e)
        }
      }

      if (!subscriptionId) {
        console.log("[webhook] session completed but no subscription yet; will rely on customer.subscription.created")
        return NextResponse.json({ received: true })
      }

      // Billing customer and plan resolution code
      if (s.metadata?.user_id && s.customer) {
        try {
          await getSupabaseAdmin().from("billing_customers").upsert({
            user_id: s.metadata.user_id,
            stripe_customer_id: s.customer as string,
          })
          console.log("[v0] Billing customer mapping created/updated")
        } catch (error) {
          console.error("[v0] Failed to create billing customer mapping:", error)
        }
      }

      let planId = s.metadata?.plan_id ?? null
      console.log("[v0] Initial plan ID from metadata:", planId)

      if (!planId && s.client_reference_id) {
        console.log("[v0] Trying client_reference_id:", s.client_reference_id)
        const { data } = await getSupabaseAdmin().from("plans").select("id").eq("id", s.client_reference_id).single()
        planId = data?.id ?? planId
        console.log("[v0] Plan ID from client_reference_id:", planId)
      }

      if (!planId) {
        console.log("[v0] Trying stripe_session_id lookup:", s.id)
        const { data } = await getSupabaseAdmin().from("plans").select("id").eq("stripe_session_id", s.id).single()
        planId = data?.id ?? planId
        console.log("[v0] Plan ID from stripe_session_id:", planId)
      }

      if (!planId && s.customer) {
        console.log("[v0] Trying customer-based plan lookup")
        const { data: bc } = await getSupabaseAdmin()
          .from("billing_customers")
          .select("user_id")
          .eq("stripe_customer_id", s.customer as string)
          .single()

        if (bc?.user_id) {
          console.log("[v0] Found user_id from billing customer:", bc.user_id)
          const { data: p } = await getSupabaseAdmin()
            .from("plans")
            .select("id")
            .in("status", ["checkout_in_progress", "checkout", "draft"])
            .eq("user_id", bc.user_id)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle()
          planId = p?.id ?? planId
          console.log("[v0] Plan ID from customer lookup:", planId)
        }
      }

      // Check if this is a topper subscription (has dog_id but no plan_id)
      const isTopperSubscription = !planId && s.metadata?.dog_id

      if (!planId && !isTopperSubscription) {
        console.error("[v0] Could not resolve plan ID for checkout session and not a topper:", s.id)
        return NextResponse.json({ received: true, error: "Plan not found" })
      }

      if (s.payment_status === "paid") {
        console.log("[v0] Payment is paid, processing subscription creation")

        if (isTopperSubscription) {
          // Handle topper subscription (no plan_id, just dog_id in metadata)
          console.log("[v0] Processing topper subscription:", subscriptionId)
          console.log("[v0] Topper metadata:", s.metadata)

          if (!s.metadata?.user_id) {
            console.error("[v0] Missing user_id for topper subscription:", subscriptionId)
            return NextResponse.json({ error: "Missing user_id" }, { status: 400 })
          }

          // Create subscription record for topper (plan_id = NULL)
          await upsertSubscriptionFromIds({ subscriptionId, session: s })

          console.log("[v0] Topper subscription created successfully")
        } else {
          // Handle plan-based subscription
          // First, check if the plan exists and get its current state
          const { data: existingPlan, error: planFetchError } = await getSupabaseAdmin()
            .from("plans")
            .select("*")
            .eq("id", planId)
            .single()

          if (planFetchError) {
            console.error("[v0] Failed to fetch plan:", planFetchError)
            return NextResponse.json({ error: "Plan not found" }, { status: 400 })
          }

          if (!existingPlan) {
            console.error("[v0] Plan not found:", planId)
            return NextResponse.json({ error: "Plan not found" }, { status: 400 })
          }

          console.log("[v0] Found plan:", existingPlan.id, "user_id:", existingPlan.user_id, "status:", existingPlan.status)

          // Update plan to active and set user_id
          const { error: updateError } = await getSupabaseAdmin()
            .from("plans")
            .update({
              status: "active",
              stripe_subscription_id: subscriptionId,
              user_id: s.metadata?.user_id || existingPlan.user_id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", planId)

          if (updateError) {
            console.error("[v0] Failed to update plan status:", updateError)
            console.error("[v0] Plan update error details:", JSON.stringify(updateError, null, 2))
          } else {
            console.log("[v0] Plan status updated to active successfully")
          }

          // Upsert subscription with the subscription id we now have
          console.log("[v0] Creating subscription for plan:", planId)
          await upsertSubscriptionFromIds({ subscriptionId, session: s })

          // Create order (existing order creation logic)
          const { data: plan } = await getSupabaseAdmin()
            .from("plans")
            .select("user_id, dog_id, total_cents, subtotal_cents, discount_cents")
            .eq("id", planId)
            .single()

          if (plan) {
            const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
            const orderData = {
              user_id: plan.user_id,
              plan_id: planId,
              order_number: orderNumber,
              status: "confirmed",
              total: (plan.total_cents || 0) / 100,
              delivery_method: "shipping",
              stripe_subscription_id: subscriptionId,
              period_start: new Date().toISOString(),
              period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }

            const { error: orderError } = await getSupabaseAdmin().from("orders").insert(orderData)
            if (orderError) {
              console.error("[v0] Failed to create order:", orderError)
            } else {
              console.log("[v0] Order created successfully:", orderNumber)
            }
          }
        }
      }

      // CRITICAL: Create order record for individual pack purchases (one-time payments)
      // This ensures all individual pack orders are tracked in the database
      if (s.mode === 'payment' && s.metadata?.product_type) {
        const productType = s.metadata.product_type

        if (productType === 'individual' || productType === '3-packs' || productType === 'cart') {
          console.log('[WEBHOOK] Creating individual pack order for session:', s.id, 'product_type:', productType)

          // Determine user_id or guest_email
          const userId = s.metadata.user_id || null
          const guestEmail = !userId ? s.customer_details?.email : null

          // Parse recipes from metadata
          let recipes: any[] = []
          try {
            // For cart purchases, recipes are in items_json
            if (productType === 'cart' && s.metadata.items_json) {
              const cartItems = JSON.parse(s.metadata.items_json)
              // Flatten recipes from all cart items
              recipes = cartItems.flatMap((item: any) =>
                item.recipes.map((r: any) => ({
                  id: r.id,
                  name: r.name,
                  quantity: item.qty || 1
                }))
              )
            } else if (s.metadata.recipes) {
              // For individual/3-pack purchases, recipes are in recipes field
              recipes = JSON.parse(s.metadata.recipes)
            }
            console.log('[WEBHOOK] Parsed recipes:', recipes.length, 'items')
          } catch (e) {
            console.error('[WEBHOOK] Error parsing recipes:', e)
          }

          // Get shipping address zipcode
          const deliveryZipcode = s.shipping_details?.address?.postal_code ||
                                 s.customer_details?.address?.postal_code

          // Generate order number
          const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

          // Calculate estimated delivery (2-4 hours for local delivery)
          const now = new Date()
          const estimatedDeliveryDate = new Date(now.getTime() + 3 * 60 * 60 * 1000) // 3 hours from now
          const startHour = estimatedDeliveryDate.getHours()
          const endHour = startHour + 2
          const estimatedDeliveryWindow = `${startHour % 12 || 12}:00 ${startHour >= 12 ? 'PM' : 'AM'} - ${endHour % 12 || 12}:00 ${endHour >= 12 ? 'PM' : 'AM'}`

          // Format recipe name from recipes array
          const recipeName = recipes.length > 0
            ? recipes.map((r: any) => r.name).join(', ')
            : 'Fresh Food Pack'

          const orderData = {
            user_id: userId,
            guest_email: guestEmail,
            order_number: orderNumber,
            order_type: 'individual-pack',
            status: 'paid',
            fulfillment_status: 'looking_for_driver',
            delivery_method: 'local_delivery',
            delivery_zipcode: deliveryZipcode,
            estimated_delivery_date: estimatedDeliveryDate.toISOString().split('T')[0],
            estimated_delivery_window: estimatedDeliveryWindow,
            stripe_session_id: s.id,
            stripe_payment_intent_id: s.payment_intent as string,
            total: (s.amount_total || 0) / 100,
            total_cents: s.amount_total || 0,
            recipes: recipes,
            recipe_name: recipeName,
            quantity: recipes.reduce((sum: number, r: any) => sum + (r.quantity || 1), 0),
            is_subscription_order: false,
            created_at: new Date().toISOString(),
          }

          console.log('[WEBHOOK] Order data:', JSON.stringify(orderData, null, 2))

          const { data: order, error: orderError } = await getSupabaseAdmin()
            .from('orders')
            .insert(orderData)
            .select()
            .single()

          if (orderError) {
            console.error('[WEBHOOK] Failed to create order:', orderError)
            console.error('[WEBHOOK] Order data that failed:', JSON.stringify(orderData, null, 2))
          } else {
            console.log('[WEBHOOK] Order created successfully:', order.id)

            // Create initial tracking event
            try {
              await getSupabaseAdmin().from('delivery_tracking_events').insert({
                order_id: order.id,
                event_type: 'looking_for_driver',
                description: 'Order received. Looking for an available driver in your area.',
                metadata: {
                  payment_intent: s.payment_intent as string,
                  checkout_session: s.id,
                },
                created_at: new Date().toISOString(),
              })
              console.log('[WEBHOOK] Initial tracking event created for order:', order.id)
            } catch (trackingError) {
              console.error('[WEBHOOK] Failed to create tracking event:', trackingError)
            }

            // If guest order, create claim record
            if (guestEmail && !userId) {
              try {
                // Generate a simple claim token
                const claimToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

                await getSupabaseAdmin().from('guest_order_claims').insert({
                  guest_email: guestEmail,
                  stripe_session_id: s.id,
                  order_id: order.id,
                  claim_token: claimToken,
                  created_at: new Date().toISOString(),
                })
                console.log('[WEBHOOK] Guest order claim record created for:', guestEmail)
              } catch (claimError) {
                console.error('[WEBHOOK] Failed to create guest claim record:', claimError)
              }
            }
          }
        }
      }

      return NextResponse.json({ received: true })
    }

    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription
      console.log("[v0] Processing customer.subscription.created:", sub.id)

      const planId = (sub.metadata && sub.metadata.plan_id) || null

      // If planId is missing, try to backfill from price mapping
      let resolvedPlanId = planId
      if (!resolvedPlanId && sub.items.data[0]?.price?.id) {
        resolvedPlanId = await resolvePlanIdFromPrice(sub.items.data[0].price.id)
        console.log("[v0] Resolved plan ID from price:", resolvedPlanId)
      }

      // Get user_id from the plan if not available in subscription metadata
      let userId = sub.metadata?.user_id
      if (!userId && resolvedPlanId) {
        const { data: planData } = await getSupabaseAdmin()
          .from("plans")
          .select("user_id")
          .eq("id", resolvedPlanId)
          .single()
        userId = planData?.user_id
        console.log("[v0] Resolved user_id from plan:", userId)
      }

      // Skip subscription creation if we don't have a user_id
      if (!userId) {
        console.log("[v0] Skipping subscription creation - no user_id found for subscription:", sub.id)
        return NextResponse.json({ received: true })
      }

      const subscriptionData = {
        user_id: userId,
        stripe_subscription_id: sub.id,
        stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
        stripe_price_id: sub.items.data[0]?.price?.id || null,
        plan_id: resolvedPlanId,
        status: sub.status,
        current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : new Date().toISOString(),
        current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end ?? false,
        currency: sub.currency,
        interval: sub.items.data[0]?.price.recurring?.interval || "month",
        interval_count: sub.items.data[0]?.price.recurring?.interval_count || 1,
        billing_cycle: mapStripeIntervalToBillingCycle(sub.items.data[0]?.price.recurring?.interval) || "monthly",
        metadata: sub.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("[v0] Attempting to upsert subscription from customer.subscription.created with data:", JSON.stringify(subscriptionData, null, 2))
      
      const { error: subError } = await getSupabaseAdmin().from("subscriptions").upsert(subscriptionData, {
        onConflict: "stripe_subscription_id",
        ignoreDuplicates: false,
      })

      if (subError) {
        console.error("[v0] Failed to upsert subscription from customer.subscription.created:", subError)
        console.error("[v0] Subscription data that failed:", JSON.stringify(subscriptionData, null, 2))
      } else {
        console.log("[v0] Subscription upserted from customer.subscription.created")
      }

      return NextResponse.json({ received: true })
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription
      console.log("[v0] Processing customer.subscription.updated:", sub.id, "status:", sub.status, "pause_collection:", sub.pause_collection)

      // Determine actual status: Stripe keeps status as "active" when using pause_collection
      // So we need to check pause_collection to detect paused subscriptions
      let subscriptionStatus = sub.status
      if (sub.pause_collection && sub.pause_collection.behavior) {
        subscriptionStatus = 'paused'
        console.log("[v0] Detected pause_collection, setting status to 'paused'")
      }

      // Update the subscription status in our database
      // IMPORTANT: Also sync metadata and price_id to keep Supabase in sync with Stripe
      const { error: updateError } = await getSupabaseAdmin()
        .from("subscriptions")
        .update({
          status: subscriptionStatus,
          current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
          current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
          canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
          pause_json: sub.pause_collection || null,
          metadata: sub.metadata || {},
          stripe_price_id: sub.items.data[0]?.price?.id || null,
        })
        .eq("stripe_subscription_id", sub.id)

      if (updateError) {
        console.error("[v0] Failed to update subscription status:", updateError)
      } else {
        console.log("[v0] Subscription status updated to:", subscriptionStatus)
      }

      return NextResponse.json({ received: true })
    }

    case "invoice.paid": {
      // Create a delivery record when invoice is paid (subscription renewal)
      const invoice = event.data.object as Stripe.Invoice
      console.log("[v0] Processing invoice.paid:", invoice.id)

      // Only process subscription invoices
      if (!invoice.subscription) {
        console.log("[v0] Invoice is not for a subscription, skipping delivery creation")
        return NextResponse.json({ received: true })
      }

      const subscriptionId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription.id

      // Get subscription details from our database
      const { data: subscription, error: subError } = await getSupabaseAdmin()
        .from("subscriptions")
        .select("*, plans(id, dog_id, delivery_zipcode, user_id)")
        .eq("stripe_subscription_id", subscriptionId)
        .single()

      if (subError || !subscription) {
        console.log("[v0] Subscription not found for invoice:", subscriptionId)
        return NextResponse.json({ received: true })
      }

      // Get the plan items for this subscription
      const { data: planItems } = await getSupabaseAdmin()
        .from("plan_items")
        .select("qty, size_g, recipes(name)")
        .eq("plan_id", subscription.plan_id)

      // Format items for storage
      const items = planItems?.map(item => ({
        name: (item.recipes as any)?.name || "Unknown item",
        qty: item.qty,
        size_g: item.size_g,
      })) || []

      // Calculate scheduled delivery date (typically period_end or a few days before)
      const periodEnd = invoice.lines.data[0]?.period?.end
      const scheduledDate = periodEnd
        ? new Date(periodEnd * 1000)
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // Default to 2 weeks

      // Get delivery address from plan or customer
      const plan = subscription.plans as any

      // Check if delivery already exists for this period
      const { data: existingDelivery } = await getSupabaseAdmin()
        .from("deliveries")
        .select("id")
        .eq("subscription_id", subscription.id)
        .eq("scheduled_date", scheduledDate.toISOString().split('T')[0])
        .single()

      if (existingDelivery) {
        console.log("[v0] Delivery already exists for this period:", existingDelivery.id)
        return NextResponse.json({ received: true })
      }

      // Create delivery record
      const deliveryData = {
        user_id: subscription.user_id,
        subscription_id: subscription.id,
        plan_id: subscription.plan_id,
        scheduled_date: scheduledDate.toISOString().split('T')[0],
        status: "scheduled",
        items: items,
        delivery_zipcode: plan?.delivery_zipcode || null,
      }

      const { error: deliveryError } = await getSupabaseAdmin()
        .from("deliveries")
        .insert(deliveryData)

      if (deliveryError) {
        console.error("[v0] Failed to create delivery:", deliveryError)
      } else {
        console.log("[v0] Delivery created for subscription:", subscriptionId, "scheduled for:", scheduledDate.toISOString().split('T')[0])
      }

      return NextResponse.json({ received: true })
    }

    default:
      console.log("[v0] Unhandled event type:", event.type)
      break
  }

  return NextResponse.json({ received: true })
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "Stripe webhook endpoint is active",
  })
}
