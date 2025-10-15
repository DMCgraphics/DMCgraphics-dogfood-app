export const runtime = "nodejs"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerSupabase } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { subscription_id } = await req.json()
    const supabase = await createServerSupabase()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!subscription_id) {
      return NextResponse.json({ error: "Missing subscription_id" }, { status: 400 })
    }

    console.log("[v0] Reactivating subscription:", subscription_id, "for user:", user.id)

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

    // Reactivate the subscription in Stripe by removing cancel_at_period_end
    const reactivatedSubscription = await stripe.subscriptions.update(subscription_id, {
      cancel_at_period_end: false,
    })

    console.log("[v0] Subscription reactivated in Stripe:", reactivatedSubscription.id)

    // Update subscription status in database
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "active",
        cancel_at_period_end: false,
        canceled_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscription_id)
      .eq("user_id", user.id)

    if (updateError) {
      console.error("[v0] Error updating subscription in database:", updateError)
      return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
    }

    console.log("[v0] Subscription reactivated successfully")

    return NextResponse.json({
      success: true,
      message: "Subscription reactivated successfully"
    })
  } catch (error: any) {
    console.error("[v0] Error reactivating subscription:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to reactivate subscription" },
      { status: 500 }
    )
  }
}
