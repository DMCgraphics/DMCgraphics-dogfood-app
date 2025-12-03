import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"
import Stripe from "stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface Order {
  id: string
  date: string
  status: "delivered" | "shipped" | "processing" | "cancelled"
  total: number
  items: OrderItem[]
  trackingNumber?: string
  estimatedDelivery?: string
  fulfillmentStatus?: string
  hasTracking?: boolean
  driverName?: string
  estimatedDeliveryWindow?: string
}

/**
 * Fetch all orders for the authenticated user
 * Includes individual pack purchases and subscription deliveries
 */
export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[ORDERS API] Fetching orders for user:", user.email)

    const orders: Order[] = []

    // 1. Fetch individual pack orders from Stripe payment intents
    try {
      // Find Stripe customer by email
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      })

      if (customers.data && customers.data.length > 0) {
        const customer = customers.data[0]
        console.log("[ORDERS API] Found Stripe customer:", customer.id)

        // Fetch payment intents for this customer
        const paymentIntents = await stripe.paymentIntents.list({
          customer: customer.id,
          limit: 100,
        })

        console.log("[ORDERS API] Found", paymentIntents.data.length, "payment intents")

        // Filter for successful one-time payments for individual/3-pack products
        const individualPurchases = paymentIntents.data.filter((pi) => {
          const metadata = pi.metadata || {}
          const isOneTime = !pi.invoice
          const isIndividualProduct =
            metadata.product_type === "individual" ||
            metadata.product_type === "3-packs" ||
            metadata.product_type === "cart"
          const isSuccessful = pi.status === "succeeded"

          return isSuccessful && isOneTime && isIndividualProduct
        })

        console.log("[ORDERS API] Found", individualPurchases.length, "individual pack orders")

        // Convert Stripe payment intents to Order format
        for (const pi of individualPurchases) {
          const metadata = pi.metadata || {}

          // Parse recipes from metadata
          let recipes: any[] = []
          try {
            if (metadata.recipes) {
              recipes = JSON.parse(metadata.recipes)
            }
          } catch (e) {
            console.error("[ORDERS API] Error parsing recipes:", e)
          }

          // Handle cart purchases (multiple items)
          if (metadata.product_type === "cart" && metadata.items_json) {
            try {
              const cartItems = JSON.parse(metadata.items_json)
              for (const item of cartItems) {
                const itemRecipes = item.recipes || []
                const itemName =
                  itemRecipes.length > 0
                    ? itemRecipes.map((r: any) => r.name).join(", ")
                    : item.type === "3-pack"
                    ? "3-Pack Bundle"
                    : "Individual Pack"

                orders.push({
                  id: `${pi.id}-${item.recipes?.[0]?.slug || "item"}`,
                  date: new Date(pi.created * 1000).toISOString(),
                  status: "processing", // Default status for paid orders
                  total: (item.price || 0) / 100, // Convert from cents to dollars
                  items: [
                    {
                      name: itemName,
                      quantity: 1,
                      price: (item.price || 0) / 100,
                    },
                  ],
                })
              }
            } catch (e) {
              console.error("[ORDERS API] Error parsing cart items:", e)
            }
          } else {
            // Single item purchase
            const recipeName =
              recipes.length > 0
                ? recipes.map((r: any) => r.name).join(", ")
                : metadata.recipe_name || "Fresh Food Pack"

            const productType = metadata.product_type === "3-packs" ? "3-Pack Bundle" : "Individual Pack"

            orders.push({
              id: pi.id,
              date: new Date(pi.created * 1000).toISOString(),
              status: "processing", // Default status for paid orders
              total: pi.amount / 100, // Convert from cents to dollars
              items: [
                {
                  name: recipeName,
                  quantity: 1,
                  price: pi.amount / 100,
                },
              ],
            })
          }
        }
      } else {
        console.log("[ORDERS API] No Stripe customer found for email:", user.email)
      }
    } catch (error) {
      console.error("[ORDERS API] Error fetching Stripe orders:", error)
      // Don't fail the entire request if Stripe fetch fails
    }

    // 2. Fetch orders from database (when webhook creates them)
    // This will be populated after we implement the webhook enhancement
    try {
      const { data: dbOrders, error: dbError } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (dbError) {
        console.error("[ORDERS API] Error fetching database orders:", dbError)
      } else if (dbOrders && dbOrders.length > 0) {
        console.log("[ORDERS API] Found", dbOrders.length, "orders in database")

        // Convert database orders to Order format
        for (const dbOrder of dbOrders) {
          const recipes = dbOrder.recipes || []
          const recipeName =
            recipes.length > 0
              ? recipes.map((r: any) => r.name).join(", ")
              : "Fresh Food Pack"

          // Map fulfillment_status to order status
          let status: Order["status"] = "processing"
          if (dbOrder.fulfillment_status === "delivered") {
            status = "delivered"
          } else if (dbOrder.fulfillment_status === "out_for_delivery") {
            status = "shipped"
          } else if (dbOrder.fulfillment_status === "cancelled") {
            status = "cancelled"
          }

          orders.push({
            id: dbOrder.id,
            date: dbOrder.created_at,
            status: status,
            total: dbOrder.total_cents / 100, // Convert from cents to dollars
            items: [
              {
                name: recipeName,
                quantity: 1,
                price: dbOrder.total_cents / 100,
              },
            ],
            estimatedDelivery: dbOrder.estimated_delivery_date || undefined,
            fulfillmentStatus: dbOrder.fulfillment_status || undefined,
            hasTracking: true, // All database orders have tracking
            driverName: dbOrder.driver_name || undefined,
            estimatedDeliveryWindow: dbOrder.estimated_delivery_window || undefined,
          })
        }
      }
    } catch (error) {
      console.error("[ORDERS API] Error fetching database orders:", error)
    }

    // Sort orders by date (newest first)
    orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    console.log("[ORDERS API] Returning", orders.length, "total orders")

    return NextResponse.json({
      orders,
      count: orders.length,
    })
  } catch (error: any) {
    console.error("[ORDERS API] Error fetching orders:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch orders" },
      { status: 500 }
    )
  }
}
