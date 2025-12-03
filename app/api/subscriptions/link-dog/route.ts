import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"
import Stripe from "stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

// Helper to determine dog size from weight
function getDogSize(weightLbs: number): "small" | "medium" | "large" | "xl" {
  if (weightLbs <= 25) return "small"
  if (weightLbs <= 50) return "medium"
  if (weightLbs <= 75) return "large"
  return "xl"
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { dogId, dogName, dogWeight } = await req.json()

    if (!dogId || !dogName || !dogWeight) {
      return NextResponse.json(
        { error: "Missing required fields: dogId, dogName, dogWeight" },
        { status: 400 }
      )
    }

    console.log("[LINK-DOG] Linking dog to subscriptions:", { dogId, dogName, dogWeight })

    // Calculate dog size
    const dogSize = getDogSize(dogWeight)
    console.log("[LINK-DOG] Calculated dog size:", dogSize)

    // Get all subscriptions for this user
    const { data: subscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "paused", "trialing"])

    if (subError) {
      console.error("[LINK-DOG] Error fetching subscriptions:", subError)
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 }
      )
    }

    console.log("[LINK-DOG] Found subscriptions:", subscriptions?.length || 0)

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { error: "No active subscriptions found" },
        { status: 404 }
      )
    }

    // Update each subscription
    const updatePromises = subscriptions.map(async (sub) => {
      try {
        // Get the current metadata from subscription
        const currentMetadata = sub.metadata || {}

        // Build updated metadata
        const updatedMetadata = {
          ...currentMetadata,
          dog_id: dogId,
          dog_name: dogName,
          dog_size: dogSize,
        }

        console.log("[LINK-DOG] Updating subscription:", sub.stripe_subscription_id, "with metadata:", updatedMetadata)

        // Update Stripe subscription metadata
        await stripe.subscriptions.update(sub.stripe_subscription_id, {
          metadata: updatedMetadata,
        })

        console.log("[LINK-DOG] Updated Stripe subscription:", sub.stripe_subscription_id)

        // Update Supabase subscription metadata
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            metadata: updatedMetadata,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.id)

        if (updateError) {
          console.error("[LINK-DOG] Error updating Supabase subscription:", updateError)
          throw updateError
        }

        console.log("[LINK-DOG] Updated Supabase subscription:", sub.id)

        return { success: true, subscriptionId: sub.stripe_subscription_id }
      } catch (error) {
        console.error("[LINK-DOG] Error updating subscription:", sub.stripe_subscription_id, error)
        return { success: false, subscriptionId: sub.stripe_subscription_id, error }
      }
    })

    const results = await Promise.all(updatePromises)
    const failures = results.filter(r => !r.success)

    if (failures.length > 0) {
      console.error("[LINK-DOG] Some subscriptions failed to update:", failures)
    }

    return NextResponse.json({
      success: true,
      message: "Dog linked to subscriptions successfully",
      updatedCount: results.filter(r => r.success).length,
      failedCount: failures.length,
      results,
    })
  } catch (error: any) {
    console.error("[LINK-DOG] Error linking dog to subscriptions:", error)
    return NextResponse.json(
      { error: error.message || "Failed to link dog to subscriptions" },
      { status: 500 }
    )
  }
}
