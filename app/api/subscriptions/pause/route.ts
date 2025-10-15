export const runtime = "nodejs"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerSupabase } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("[v0] Pause request body:", body)

    const { subscription_id } = body
    const supabase = await createServerSupabase()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!subscription_id) {
      console.error("[v0] Missing subscription_id in request body:", body)
      return NextResponse.json({ error: "Missing subscription_id" }, { status: 400 })
    }

    console.log("[v0] Pausing subscription:", subscription_id, "for user:", user.id)

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

    // Pause the subscription in Stripe
    const pausedSubscription = await stripe.subscriptions.update(subscription_id, {
      pause_collection: { behavior: "void" },
    })

    console.log("[v0] Subscription paused in Stripe:", pausedSubscription.id)

    // Update subscription status in database
    console.log("[v0] Updating database for subscription_id:", subscription_id, "user_id:", user.id)

    const { data: updateData, error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "paused",
        pause_json: pausedSubscription.pause_collection ?? { behavior: "void" },
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscription_id)
      .eq("user_id", user.id)
      .select()

    console.log("[v0] Database update result:", { updateData, updateError })

    if (updateError) {
      console.error("[v0] Error updating subscription in database:", updateError)
      return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
    }

    if (!updateData || updateData.length === 0) {
      console.error("[v0] No rows updated in database - subscription may not exist")
      return NextResponse.json({ error: "Subscription not found in database" }, { status: 404 })
    }

    console.log("[v0] Subscription paused successfully, updated rows:", updateData.length)

    return NextResponse.json({
      success: true,
      message: "Subscription paused successfully"
    })
  } catch (error: any) {
    console.error("[v0] Error pausing subscription:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to pause subscription" },
      { status: 500 }
    )
  }
}
