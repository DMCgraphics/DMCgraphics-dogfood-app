import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase, supabaseAdmin } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dogId = params.id

    // Check if user owns this dog
    const { data: dog, error: fetchError } = await supabase
      .from("dogs")
      .select("id, user_id, name")
      .eq("id", dogId)
      .single()

    if (fetchError || !dog) {
      return NextResponse.json({ error: "Dog not found" }, { status: 404 })
    }

    const isOwner = dog.user_id === user.id

    // Check if user is admin (only needed if not the owner)
    let isAdmin = false
    if (!isOwner) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single()
      isAdmin = profile?.is_admin || false
    }

    // Only allow deletion if user owns the dog or is admin
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Use user's own client if they own the dog, admin client only for admins deleting others' dogs
    const client = isOwner ? supabase : supabaseAdmin

    // Get all plan IDs for this dog first (needed to delete orders/subscriptions)
    const { data: dogPlans } = await client
      .from("plans")
      .select("id")
      .eq("dog_id", dogId)

    const planIds = dogPlans?.map(p => p.id) || []

    // Delete related data in correct order (respecting foreign key constraints)
    // 1. Delete logs (no foreign key dependencies)
    await client.from("weight_logs").delete().eq("dog_id", dogId)
    await client.from("stool_logs").delete().eq("dog_id", dogId)

    // 2. Cancel Stripe subscriptions and delete orders/subscriptions from database

    // First, find plan-based subscriptions
    let planSubscriptions: { id: string; stripe_subscription_id: string | null; status: string | null }[] = []
    if (planIds.length > 0) {
      const { data } = await client
        .from("subscriptions")
        .select("id, stripe_subscription_id, status")
        .in("plan_id", planIds)
      planSubscriptions = data || []
    }

    // Also find topper subscriptions (they have dog_id in metadata, not plan_id)
    // Topper subscriptions have plan_id = NULL and store dog_id in metadata jsonb
    const { data: topperSubscriptions } = await client
      .from("subscriptions")
      .select("id, stripe_subscription_id, status, metadata")
      .is("plan_id", null)
      .filter("metadata->>dog_id", "eq", dogId)

    // Combine all subscriptions to cancel
    const allSubscriptions = [
      ...planSubscriptions,
      ...(topperSubscriptions || [])
    ]

    // Cancel all active subscriptions in Stripe
    if (allSubscriptions.length > 0) {
      for (const sub of allSubscriptions) {
        if (sub.stripe_subscription_id && sub.status !== "canceled") {
          try {
            await stripe.subscriptions.cancel(sub.stripe_subscription_id)
            console.log(`Canceled Stripe subscription: ${sub.stripe_subscription_id}`)
          } catch (stripeError: any) {
            // Log but continue - subscription might already be canceled in Stripe
            console.warn(`Could not cancel Stripe subscription ${sub.stripe_subscription_id}:`, stripeError.message)
          }
        }
      }
    }

    // Delete subscriptions from database
    if (planIds.length > 0) {
      await client.from("orders").delete().in("plan_id", planIds)
      await client.from("subscriptions").delete().in("plan_id", planIds)
    }

    // Delete topper subscriptions (by their IDs)
    if (topperSubscriptions && topperSubscriptions.length > 0) {
      const topperSubIds = topperSubscriptions.map(s => s.id)
      await client.from("subscriptions").delete().in("id", topperSubIds)
      console.log(`Deleted ${topperSubIds.length} topper subscription(s) from database`)
    }

    // 3. Delete plan-related data
    await client.from("plan_items").delete().eq("dog_id", dogId)
    await client.from("plan_dogs").delete().eq("dog_id", dogId)

    // 4. Now delete plans
    await client.from("plans").delete().eq("dog_id", dogId)

    // Now delete the dog
    const { error: deleteError } = await client
      .from("dogs")
      .delete()
      .eq("id", dogId)

    if (deleteError) {
      console.error("Error deleting dog:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete dog" },
        { status: 500 }
      )
    }

    console.log(`Dog deleted: ${dog.name} (${dogId}) by user ${user.id}${isAdmin ? " (admin)" : ""}`)

    return NextResponse.json({ success: true, message: `${dog.name} has been deleted` })
  } catch (error) {
    console.error("Error in DELETE /api/dogs/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
