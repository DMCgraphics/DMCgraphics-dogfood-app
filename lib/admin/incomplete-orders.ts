import { supabaseAdmin } from "@/lib/supabase/server"

/**
 * Get count of incomplete orders that need sales follow-up
 * Includes:
 * 1. Draft or checkout_in_progress plans (customers who built plans but didn't checkout)
 * 2. Orders with subscriptions but missing delivery info (customers who paid but need address)
 */
export async function getIncompleteOrdersCount(): Promise<number> {
  try {
    // Count draft/checkout_in_progress plans
    const { count: draftPlansCount, error: plansError } = await supabaseAdmin
      .from("plans")
      .select("*", { count: "exact", head: true })
      .in("status", ["draft", "checkout_in_progress"])

    if (plansError) {
      console.error("[Incomplete Orders] Error counting draft plans:", plansError)
    }

    // Count orders with subscriptions missing delivery info
    const { count: missingDeliveryCount, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("*", { count: "exact", head: true })
      .not("stripe_subscription_id", "is", null)
      .is("delivery_zipcode", null)
      .not("fulfillment_status", "in", "(delivered,cancelled,failed)")

    if (ordersError) {
      console.error("[Incomplete Orders] Error counting missing delivery orders:", ordersError)
    }

    return (draftPlansCount || 0) + (missingDeliveryCount || 0)
  } catch (error) {
    console.error("[Incomplete Orders] Error getting count:", error)
    return 0
  }
}
