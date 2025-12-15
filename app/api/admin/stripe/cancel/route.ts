import { NextResponse } from "next/server"
import { getAdminUser } from "@/lib/admin/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    // Check admin authorization
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { subscription_id } = body

    if (!subscription_id) {
      return NextResponse.json({ error: "Subscription ID required" }, { status: 400 })
    }

    // Use admin client for database operations to bypass RLS
    // Get subscription from database
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("stripe_subscription_id", subscription_id)
      .single()

    if (subError || !subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    // Cancel the subscription in Stripe immediately
    const canceledSubscription = await stripe.subscriptions.cancel(subscription_id)

    // Update subscription status in database
    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscription_id)

    if (updateError) {
      console.error("[admin] Error updating subscription status:", updateError)
    }

    // Log the cancellation action
    console.log(`[admin] Subscription canceled by ${adminUser.email}:`, {
      subscription_id,
      user_id: subscription.user_id,
      canceled_at: canceledSubscription.canceled_at,
    })

    return NextResponse.json({
      success: true,
      subscription: {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
        canceled_at: canceledSubscription.canceled_at,
      },
    })
  } catch (error: any) {
    console.error("[admin] Error canceling subscription:", error)
    return NextResponse.json(
      { error: error.message || "Failed to cancel subscription" },
      { status: 500 }
    )
  }
}
