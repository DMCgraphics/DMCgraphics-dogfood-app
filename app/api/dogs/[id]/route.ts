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

    // Get all plan IDs for this dog first (needed to find subscriptions)
    const { data: dogPlans } = await client
      .from("plans")
      .select("id")
      .eq("dog_id", dogId)

    const planIds = dogPlans?.map(p => p.id) || []

    // 1. Cancel Stripe subscriptions BEFORE deleting dog (subscriptions will cascade-delete)

    // Find plan-based subscriptions
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

    // 2. Delete the dog
    // This will CASCADE delete:
    //   - plans (via plans.dog_id FK CASCADE)
    //   - plan_items (via plan_items.plan_id FK CASCADE from plans)
    //   - orders (via orders.plan_id FK CASCADE from plans)
    //   - subscriptions (via subscriptions.plan_id FK CASCADE from plans)
    //   - weight_logs (via weight_logs.dog_id FK CASCADE)
    //   - stool_logs (via stool_logs.dog_id FK CASCADE)
    //   - plan_dogs (via plan_dogs.dog_id FK CASCADE)

    // Also manually delete topper subscriptions (they reference dog_id in metadata, not FK)
    if (topperSubscriptions && topperSubscriptions.length > 0) {
      const topperSubIds = topperSubscriptions.map(s => s.id)
      await client.from("subscriptions").delete().in("id", topperSubIds)
      console.log(`Deleted ${topperSubIds.length} topper subscription(s) from database`)
    }
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
