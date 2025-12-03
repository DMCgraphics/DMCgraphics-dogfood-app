import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"
import Stripe from "stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

/**
 * Check if user has active subscriptions in Stripe
 * This is used to catch payment link customers who may not have subscriptions in Supabase yet
 */
export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[CHECK-STRIPE] Checking Stripe for subscriptions for user:", user.email)

    // Find customer by email
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    })

    if (!customers.data || customers.data.length === 0) {
      console.log("[CHECK-STRIPE] No Stripe customer found for email:", user.email)
      return NextResponse.json({
        hasSubscription: false,
        subscriptions: [],
      })
    }

    const customer = customers.data[0]
    console.log("[CHECK-STRIPE] Found Stripe customer:", customer.id)

    // Get all subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all', // Get all subscriptions regardless of status
      limit: 100,
    })

    console.log("[CHECK-STRIPE] Found", subscriptions.data.length, "subscriptions")

    // Filter for active subscriptions
    const activeSubscriptions = subscriptions.data.filter(sub =>
      ['active', 'trialing', 'past_due'].includes(sub.status)
    )

    console.log("[CHECK-STRIPE] Found", activeSubscriptions.length, "active subscriptions")

    // For each active subscription, ensure it exists in Supabase
    for (const sub of activeSubscriptions) {
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("stripe_subscription_id", sub.id)
        .single()

      if (!existingSub) {
        console.log("[CHECK-STRIPE] Subscription", sub.id, "not in Supabase - creating it")

        // Create the subscription in Supabase
        const subscriptionData = {
          user_id: user.id,
          stripe_subscription_id: sub.id,
          stripe_customer_id: customer.id,
          status: sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
          currency: sub.currency,
          interval: sub.items.data[0]?.price.recurring?.interval || "month",
          interval_count: sub.items.data[0]?.price.recurring?.interval_count || 1,
          billing_cycle: sub.items.data[0]?.price.recurring?.interval === 'week' ? 'weekly' : 'monthly',
          stripe_price_id: sub.items.data[0]?.price.id || null,
          plan_id: null, // Topper subscriptions don't have a plan_id
          metadata: sub.metadata || {},
        }

        const { error: insertError } = await supabase
          .from("subscriptions")
          .insert(subscriptionData)

        if (insertError) {
          console.error("[CHECK-STRIPE] Failed to create subscription in Supabase:", insertError)
        } else {
          console.log("[CHECK-STRIPE] Created subscription in Supabase:", sub.id)
        }
      }
    }

    return NextResponse.json({
      hasSubscription: activeSubscriptions.length > 0,
      subscriptions: activeSubscriptions.map(sub => ({
        id: sub.id,
        status: sub.status,
        metadata: sub.metadata,
      })),
    })
  } catch (error: any) {
    console.error("[CHECK-STRIPE] Error checking Stripe subscriptions:", error)
    return NextResponse.json(
      { error: error.message || "Failed to check subscriptions" },
      { status: 500 }
    )
  }
}
