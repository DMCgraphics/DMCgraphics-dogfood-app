export const runtime = "nodejs"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerSupabase } from "@/lib/supabase/server"

type CreateSubscriptionBody = { 
  sessionId: string
  planId?: string
}

export async function POST(req: Request) {
  try {
    const { sessionId, planId }: CreateSubscriptionBody = await req.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })
    const supabase = await createServerSupabase()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Creating subscription for user:", user.id, "session:", sessionId)

    // Retrieve the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription']
    })

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 })
    }

    if (!session.subscription) {
      return NextResponse.json({ error: "No subscription found" }, { status: 400 })
    }

    const subscriptionId = typeof session.subscription === 'string' 
      ? session.subscription 
      : session.subscription.id

    // Get the subscription details from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    // Get plan ID from session metadata or parameter
    const resolvedPlanId = planId || session.metadata?.plan_id || session.client_reference_id
    
    if (!resolvedPlanId) {
      return NextResponse.json({ error: "No plan ID found" }, { status: 400 })
    }

    console.log("[v0] Plan ID:", resolvedPlanId)

    // Check if subscription already exists
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("stripe_subscription_id", subscriptionId)
      .single()

    if (existingSubscription) {
      console.log("[v0] Subscription already exists")
      return NextResponse.json({ 
        success: true, 
        message: "Subscription already exists",
        subscriptionId 
      })
    }

    // Create subscription record
    const subscriptionData = {
      user_id: user.id,
      plan_id: resolvedPlanId,
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
        plan_id: resolvedPlanId,
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
      return NextResponse.json({ 
        error: "Failed to create subscription", 
        details: subError.message 
      }, { status: 500 })
    }

    // Also ensure the plan status is updated to active
    const { error: planUpdateError } = await supabase
      .from("plans")
      .update({
        status: "active",
        stripe_subscription_id: subscriptionId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", resolvedPlanId)
      .eq("user_id", user.id)

    if (planUpdateError) {
      console.error("[v0] Failed to update plan status:", planUpdateError)
      // Don't fail the request, just log the error
    } else {
      console.log("[v0] Plan status updated to active")
    }

    console.log("[v0] Subscription created successfully")
    return NextResponse.json({ 
      success: true, 
      subscriptionId,
      planId: resolvedPlanId
    })

  } catch (error) {
    console.error("[v0] Error creating subscription:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}
