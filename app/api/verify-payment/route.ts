export const runtime = "nodejs"
export const dynamic = "force-dynamic" // prevent static evaluation

import Stripe from "stripe"
import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

type VerifyBody = { sessionId?: string }

export async function POST(req: Request) {
  const { sessionId } = (await req.json()) as VerifyBody

  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 })
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 })

  const stripe = new Stripe(secret, { apiVersion: "2024-06-20" })
  const supabase = await createServerSupabase()

  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // If user is not authenticated, we'll try to get user_id from session metadata
    let userId = user?.id

    // Retrieve the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription']
    })

    console.log("[v0] Verifying payment for session:", sessionId)
    console.log("[v0] Session payment status:", session.payment_status)
    console.log("[v0] Session mode:", session.mode)
    console.log("[v0] Session metadata:", session.metadata)

    // If user is not authenticated, try to get user_id from session metadata
    if (!userId && session.metadata?.user_id) {
      userId = session.metadata.user_id
      console.log("[v0] Using user_id from session metadata:", userId)
    }

    if (!userId) {
      console.log("[v0] No user_id available from auth or session metadata")
      return NextResponse.json({ error: "Unable to identify user" }, { status: 401 })
    }

    // If payment is successful and we have a subscription, ensure it's saved to our database
    if (session.payment_status === "paid" && session.subscription) {
      const subscriptionId = typeof session.subscription === 'string' 
        ? session.subscription 
        : session.subscription.id

      console.log("[v0] Payment successful, ensuring subscription is saved:", subscriptionId)

      // Get the subscription details from Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
      
      // Get plan ID from session metadata
      const planId = session.metadata?.plan_id || session.client_reference_id
      
      console.log("[v0] Session metadata:", session.metadata)
      console.log("[v0] Session client_reference_id:", session.client_reference_id)
      console.log("[v0] Resolved plan ID:", planId)
      
      if (planId) {
        console.log("[v0] Plan ID from session:", planId)

        // First, check if the plan exists and belongs to the current user
        const { data: planData, error: planError } = await supabase
          .from("plans")
          .select("id, user_id, status")
          .eq("id", planId)
          .eq("user_id", userId)
          .single()

        if (planError || !planData) {
          console.error("[v0] Plan not found or doesn't belong to user:", planError)
          return NextResponse.json({ error: "Plan not found" }, { status: 404 })
        }

        console.log("[v0] Found plan:", planData)

        // Check if subscription already exists
        const { data: existingSubscription } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("stripe_subscription_id", subscriptionId)
          .single()

        if (!existingSubscription) {
          console.log("[v0] Subscription not found in database, creating it...")
          
          // Create subscription record
          const subscriptionData = {
            user_id: userId,
            plan_id: planId,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id,
            stripe_price_id: stripeSubscription.items.data[0]?.price.id || null,
            status: stripeSubscription.status,
            current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
            currency: stripeSubscription.currency,
            interval: stripeSubscription.items.data[0]?.price.recurring?.interval || "month",
            interval_count: stripeSubscription.items.data[0]?.price.recurring?.interval_count || 1,
            cancel_at_period_end: stripeSubscription.cancel_at_period_end || false,
            canceled_at: stripeSubscription.canceled_at
              ? new Date(stripeSubscription.canceled_at * 1000).toISOString()
              : null,
            default_payment_method_id: typeof stripeSubscription.default_payment_method === 'string' 
              ? stripeSubscription.default_payment_method 
              : stripeSubscription.default_payment_method?.id || null,
            metadata: {
              checkout_session_id: session.id,
              stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id,
              plan_id: planId,
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          console.log("[v0] Creating subscription with data:", JSON.stringify(subscriptionData, null, 2))

          const { error: subError } = await supabase
            .from("subscriptions")
            .insert(subscriptionData)

          if (subError) {
            console.error("[v0] Failed to create subscription:", subError)
            console.error("[v0] Subscription data that failed:", JSON.stringify(subscriptionData, null, 2))
          } else {
            console.log("[v0] Subscription created successfully in verify-payment endpoint")
          }
        } else {
          console.log("[v0] Subscription already exists in database, updating with latest Stripe data...")
          
          // Update existing subscription with latest Stripe data
          const updateData = {
            status: stripeSubscription.status,
            current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
            currency: stripeSubscription.currency,
            interval: stripeSubscription.items.data[0]?.price.recurring?.interval || "month",
            interval_count: stripeSubscription.items.data[0]?.price.recurring?.interval_count || 1,
            cancel_at_period_end: stripeSubscription.cancel_at_period_end || false,
            canceled_at: stripeSubscription.canceled_at
              ? new Date(stripeSubscription.canceled_at * 1000).toISOString()
              : null,
            default_payment_method_id: typeof stripeSubscription.default_payment_method === 'string' 
              ? stripeSubscription.default_payment_method 
              : stripeSubscription.default_payment_method?.id || null,
            updated_at: new Date().toISOString(),
          }

          const { error: updateError } = await supabase
            .from("subscriptions")
            .update(updateData)
            .eq("stripe_subscription_id", subscriptionId)

          if (updateError) {
            console.error("[v0] Failed to update existing subscription:", updateError)
          } else {
            console.log("[v0] Existing subscription updated successfully")
          }
        }

        // Also ensure the plan status is updated to active
        const { error: planUpdateError } = await supabase
          .from("plans")
          .update({
            status: "active",
            stripe_subscription_id: subscriptionId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", planData.id)
          .eq("user_id", userId)

        if (planUpdateError) {
          console.error("[v0] Failed to update plan status:", planUpdateError)
        } else {
          console.log("[v0] Plan status updated to active")
        }
      } else {
        console.warn("[v0] No plan ID found in session metadata")
      }
    }

    return NextResponse.json({
      status: session.payment_status,
      mode: session.mode,
      subscriptionId: session.subscription ? (typeof session.subscription === 'string' ? session.subscription : session.subscription.id) : null,
    })
  } catch (error) {
    console.error("[v0] Error in verify-payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export function GET() {
  return new NextResponse("Use POST", { status: 405, headers: { Allow: "POST" } })
}
