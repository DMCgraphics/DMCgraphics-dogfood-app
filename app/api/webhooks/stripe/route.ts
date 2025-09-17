export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import type Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

function reqEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env ${name}`)
  return v
}

const supabaseAdmin = createClient(
  reqEnv("SUPABASE_URL"),
  reqEnv("SUPABASE_SERVICE_ROLE_KEY"), // service role to bypass RLS
)

// Helper function for resolving plan ID from price
async function resolvePlanIdFromPrice(stripePriceId: string) {
  const { data, error } = await supabaseAdmin
    .from("product_prices")
    .select("plan_id")
    .eq("stripe_price_id", stripePriceId)
    .maybeSingle()
  return error ? null : (data?.plan_id ?? null)
}

// Helper function for upserting subscription from IDs
async function upsertSubscriptionFromIds({
  subscriptionId,
  session,
}: { subscriptionId: string; session: Stripe.Checkout.Session }) {
  console.log("[v0] Upserting subscription from IDs:", subscriptionId)

  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)

    const planId = session.metadata?.plan_id || session.client_reference_id

    // Get user_id from the plan if not available in session metadata
    let userId = session.metadata?.user_id
    if (!userId && planId) {
      const { data: planData } = await supabaseAdmin
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

    const subscriptionData = {
      user_id: userId,
      plan_id: planId,
      stripe_subscription_id: subscriptionId,
      status: "active",
      current_period_start: stripeSubscription.current_period_start ? new Date(stripeSubscription.current_period_start * 1000).toISOString() : new Date().toISOString(),
      current_period_end: stripeSubscription.current_period_end ? new Date(stripeSubscription.current_period_end * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      currency: stripeSubscription.currency,
      interval: stripeSubscription.items.data[0]?.price.recurring?.interval || "month",
      interval_count: stripeSubscription.items.data[0]?.price.recurring?.interval_count || 1,
      billing_cycle: stripeSubscription.items.data[0]?.price.recurring?.interval || "monthly",
      stripe_price_id: stripeSubscription.items.data[0]?.price.id || null,
      cancel_at_period_end: stripeSubscription.cancel_at_period_end || false,
      canceled_at: stripeSubscription.canceled_at
        ? new Date(stripeSubscription.canceled_at * 1000).toISOString()
        : null,
      default_payment_method_id: (stripeSubscription.default_payment_method as string) || null,
      metadata: {
        checkout_session_id: session.id,
        stripe_customer_id: session.customer as string,
        plan_id: planId,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("[v0] Attempting to upsert subscription with data:", JSON.stringify(subscriptionData, null, 2))
    
    const { error: subError } = await supabaseAdmin.from("subscriptions").upsert(subscriptionData, {
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
    await supabaseAdmin.from("stripe_events").insert({
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
          await supabaseAdmin.from("billing_customers").upsert({
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
        const { data } = await supabaseAdmin.from("plans").select("id").eq("id", s.client_reference_id).single()
        planId = data?.id ?? planId
        console.log("[v0] Plan ID from client_reference_id:", planId)
      }

      if (!planId) {
        console.log("[v0] Trying stripe_session_id lookup:", s.id)
        const { data } = await supabaseAdmin.from("plans").select("id").eq("stripe_session_id", s.id).single()
        planId = data?.id ?? planId
        console.log("[v0] Plan ID from stripe_session_id:", planId)
      }

      if (!planId && s.customer) {
        console.log("[v0] Trying customer-based plan lookup")
        const { data: bc } = await supabaseAdmin
          .from("billing_customers")
          .select("user_id")
          .eq("stripe_customer_id", s.customer as string)
          .single()

        if (bc?.user_id) {
          console.log("[v0] Found user_id from billing customer:", bc.user_id)
          const { data: p } = await supabaseAdmin
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

      if (!planId) {
        console.error("[v0] Could not resolve plan ID for checkout session:", s.id)
        return NextResponse.json({ received: true, error: "Plan not found" })
      }

      if (s.payment_status === "paid") {
        console.log("[v0] Payment is paid, processing subscription creation")
        
        // First, check if the plan exists and get its current state
        const { data: existingPlan, error: planFetchError } = await supabaseAdmin
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
        const { error: updateError } = await supabaseAdmin
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
        const { data: plan } = await supabaseAdmin
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

          const { error: orderError } = await supabaseAdmin.from("orders").insert(orderData)
          if (orderError) {
            console.error("[v0] Failed to create order:", orderError)
          } else {
            console.log("[v0] Order created successfully:", orderNumber)
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
        const { data: planData } = await supabaseAdmin
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
        billing_cycle: sub.items.data[0]?.price.recurring?.interval || "monthly",
        metadata: sub.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("[v0] Attempting to upsert subscription from customer.subscription.created with data:", JSON.stringify(subscriptionData, null, 2))
      
      const { error: subError } = await supabaseAdmin.from("subscriptions").upsert(subscriptionData, {
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
