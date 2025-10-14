import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabase()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { stripeSubscriptionId, planId } = await request.json()

    if (!stripeSubscriptionId || !planId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    console.log("[v0] Updating subscription:", { stripeSubscriptionId, planId, userId: user.id })

    // Fetch the plan items from the database
    const { data: planItems, error: itemsError } = await supabase
      .from("plan_items")
      .select("stripe_price_id, qty")
      .eq("plan_id", planId)

    if (itemsError || !planItems || planItems.length === 0) {
      console.error("[v0] Error fetching plan items:", itemsError)
      return NextResponse.json({ error: "Plan items not found" }, { status: 404 })
    }

    console.log("[v0] Plan items to update subscription with:", planItems)

    // Fetch the current Stripe subscription
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
    console.log("[v0] Current subscription items:", subscription.items.data)

    // Prepare the subscription item updates
    const items = planItems
      .filter((item) => item.stripe_price_id)
      .map((item) => ({
        price: item.stripe_price_id,
        quantity: item.qty || 1,
      }))

    if (items.length === 0) {
      return NextResponse.json({ error: "No valid price IDs found in plan items" }, { status: 400 })
    }

    console.log("[v0] New subscription items:", items)

    // Remove all existing items and add new ones
    const itemsToRemove = subscription.items.data.map((item) => ({
      id: item.id,
      deleted: true,
    }))

    // Update the Stripe subscription
    const updatedSubscription = await stripe.subscriptions.update(stripeSubscriptionId, {
      items: [
        ...itemsToRemove,
        ...items,
      ],
      proration_behavior: "create_prorations", // Prorate the changes
    })

    console.log("[v0] Subscription updated successfully:", updatedSubscription.id)

    // Update the subscription record in database with new price info
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", stripeSubscriptionId)
      .eq("user_id", user.id)

    if (updateError) {
      console.error("[v0] Error updating subscription in database:", updateError)
    }

    return NextResponse.json({
      success: true,
      subscriptionId: updatedSubscription.id,
      message: "Subscription updated successfully",
    })
  } catch (error: any) {
    console.error("[v0] Error updating subscription:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to update subscription" },
      { status: 500 }
    )
  }
}
