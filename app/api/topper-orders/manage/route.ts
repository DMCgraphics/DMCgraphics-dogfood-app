import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"
import Stripe from "stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

// Price IDs for topper subscriptions - same as in topper-purchase-dialog.tsx
const isTestMode = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test')

const testPriceIds: Record<string, Record<string, string>> = {
  small: {
    "25": "price_1SWJxb0R4BbWwBbfVA5IBfGv",
    "50": "price_1SWJxb0R4BbWwBbfAuVzB9gn",
    "75": "price_1SWJxb0R4BbWwBbfukkyjoMG",
  },
  medium: {
    "25": "price_1SWJxc0R4BbWwBbfpXUvIOPp",
    "50": "price_1SWJxc0R4BbWwBbfDFVH0o4p",
    "75": "price_1SWJxd0R4BbWwBbfSQAsNJHW",
  },
  large: {
    "25": "price_1SWJxd0R4BbWwBbfeCuwcPy9",
    "50": "price_1SWJxd0R4BbWwBbfjhnoOngK",
    "75": "price_1SWJxe0R4BbWwBbfhuaK5zGR",
  },
  xl: {
    "25": "price_1SWJxe0R4BbWwBbfdR559REx",
    "50": "price_1SWJxe0R4BbWwBbf1st8bqEP",
    "75": "price_1SWJxf0R4BbWwBbfACrG4vhJ",
  },
}

const livePriceIds: Record<string, Record<string, string>> = {
  small: {
    "25": "price_1SWJzN0WbfuHe9kAx4SXb84S",
    "50": "price_1SWJzN0WbfuHe9kAsXdakLI3",
    "75": "price_1SWJzN0WbfuHe9kAONAtGz3X",
  },
  medium: {
    "25": "price_1SWJzO0WbfuHe9kASj0g84Wr",
    "50": "price_1SWJzO0WbfuHe9kA5noP4YrR",
    "75": "price_1SWJzP0WbfuHe9kAeoHNdmGS",
  },
  large: {
    "25": "price_1SWJzP0WbfuHe9kAxg6CeyiM",
    "50": "price_1SWJzP0WbfuHe9kAjUYsaqBC",
    "75": "price_1SWJzQ0WbfuHe9kAQ3sylBEl",
  },
  xl: {
    "25": "price_1SWJzQ0WbfuHe9kA697GdnPz",
    "50": "price_1SWJzQ0WbfuHe9kA38OztrDK",
    "75": "price_1SWJzR0WbfuHe9kASGjhdWlu",
  },
}

const priceIds = isTestMode ? testPriceIds : livePriceIds

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, subscriptionId, newLevel, dogSize } = await req.json()

    if (!action || !subscriptionId) {
      return NextResponse.json(
        { error: "Missing action or subscriptionId" },
        { status: 400 }
      )
    }

    switch (action) {
      case 'pause': {
        // Pause the subscription by setting pause_collection
        const subscription = await stripe.subscriptions.update(subscriptionId, {
          pause_collection: {
            behavior: 'void',
          },
        })

        return NextResponse.json({
          success: true,
          message: "Subscription paused successfully",
          subscription: {
            id: subscription.id,
            status: subscription.status,
            pauseCollection: subscription.pause_collection,
          }
        })
      }

      case 'resume': {
        // Resume the subscription by removing pause_collection
        const subscription = await stripe.subscriptions.update(subscriptionId, {
          pause_collection: null,
        })

        return NextResponse.json({
          success: true,
          message: "Subscription resumed successfully",
          subscription: {
            id: subscription.id,
            status: subscription.status,
          }
        })
      }

      case 'modify': {
        if (!newLevel || !dogSize) {
          return NextResponse.json(
            { error: "Missing newLevel or dogSize for modify action" },
            { status: 400 }
          )
        }

        // Get the new price ID
        const newPriceId = priceIds[dogSize]?.[newLevel]
        if (!newPriceId) {
          return NextResponse.json(
            { error: "Invalid dog size or topper level" },
            { status: 400 }
          )
        }

        // Get current subscription to find the item ID
        const currentSub = await stripe.subscriptions.retrieve(subscriptionId)
        const itemId = currentSub.items.data[0]?.id

        if (!itemId) {
          return NextResponse.json(
            { error: "Could not find subscription item" },
            { status: 400 }
          )
        }

        // Update the subscription with the new price
        const subscription = await stripe.subscriptions.update(subscriptionId, {
          items: [{
            id: itemId,
            price: newPriceId,
          }],
          metadata: {
            ...currentSub.metadata,
            product_type: newLevel,
          },
          proration_behavior: 'create_prorations', // Prorate the change
        })

        // IMPORTANT: Also update Supabase to keep metadata in sync
        const supabase = createServerSupabase()
        const { error: supabaseError } = await supabase
          .from("subscriptions")
          .update({
            metadata: subscription.metadata || {},
            stripe_price_id: newPriceId,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId)

        if (supabaseError) {
          console.error("[TOPPER-MANAGE] Failed to update Supabase subscription:", supabaseError)
          // Don't fail the request - Stripe was updated successfully
        } else {
          console.log("[TOPPER-MANAGE] Successfully synced subscription to Supabase")
        }

        return NextResponse.json({
          success: true,
          message: `Subscription updated to ${newLevel}% topper plan`,
          subscription: {
            id: subscription.id,
            status: subscription.status,
            newLevel,
          }
        })
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Must be 'pause', 'resume', or 'modify'" },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error("Error managing topper subscription:", error)
    return NextResponse.json(
      { error: error.message || "Failed to manage subscription" },
      { status: 500 }
    )
  }
}
