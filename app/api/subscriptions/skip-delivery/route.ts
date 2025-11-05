import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerSupabase } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const { subscription_id } = await req.json()

    if (!subscription_id) {
      return NextResponse.json({ error: "Missing subscription_id" }, { status: 400 })
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" })
    const supabase = createServerSupabase()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[skip-delivery] Skipping next delivery for subscription:", subscription_id)

    // Retrieve the subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscription_id)

    console.log("[skip-delivery] Current subscription period:", {
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
    })

    // Calculate the date to skip: next billing period after current_period_end
    const currentPeriodEnd = subscription.current_period_end
    const skipUntilTimestamp = currentPeriodEnd + (7 * 24 * 60 * 60) // Add 7 days (1 week)

    console.log("[skip-delivery] Will skip delivery until:", new Date(skipUntilTimestamp * 1000))

    // Use pause_collection to skip the next billing cycle
    // This will pause collection at the end of the current period for one billing cycle
    const updatedSubscription = await stripe.subscriptions.update(subscription_id, {
      pause_collection: {
        behavior: "void", // Don't charge for the skipped period
        resumes_at: skipUntilTimestamp, // Resume after one billing cycle
      },
      metadata: {
        ...subscription.metadata,
        skipped_delivery: "true",
        skipped_at: new Date().toISOString(),
        resumes_at: new Date(skipUntilTimestamp * 1000).toISOString(),
      },
    })

    console.log("[skip-delivery] Subscription updated successfully:", {
      pause_collection: updatedSubscription.pause_collection,
      resumes_at: updatedSubscription.pause_collection?.resumes_at
        ? new Date(updatedSubscription.pause_collection.resumes_at * 1000)
        : null,
    })

    // Update the subscription in our database
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "paused",
        metadata: {
          ...subscription.metadata,
          skipped_delivery: "true",
          skipped_at: new Date().toISOString(),
          resumes_at: new Date(skipUntilTimestamp * 1000).toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscription_id)
      .eq("user_id", user.id)

    if (updateError) {
      console.error("[skip-delivery] Error updating database:", updateError)
    }

    return NextResponse.json({
      success: true,
      message: "Next delivery skipped successfully",
      resumes_at: new Date(skipUntilTimestamp * 1000).toISOString(),
    })
  } catch (error: any) {
    console.error("[skip-delivery] Error:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to skip delivery",
      },
      { status: 500 }
    )
  }
}

export function GET() {
  return new NextResponse("Use POST", { status: 405, headers: { Allow: "POST" } })
}
