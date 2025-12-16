import { supabaseAdmin } from "@/lib/supabase/server"
import { IncompleteOrdersTable } from "@/components/admin/incomplete-orders-table"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function getIncompleteOrders() {
  // Get incomplete orders: checkout_in_progress OR missing delivery details
  // Using two separate queries and merging to avoid PostgREST syntax issues
  // Include user email by joining with profiles table

  // Query 1: checkout_in_progress orders
  const { data: checkoutOrders, error: checkoutError } = await supabaseAdmin
    .from("orders")
    .select(`
      *,
      profiles:user_id (
        email,
        full_name
      )
    `)
    .eq("status", "checkout_in_progress")
    .not("fulfillment_status", "in", "(delivered,cancelled,failed)")
    .order("created_at", { ascending: false })

  if (checkoutError) {
    console.error("Error fetching checkout orders:", checkoutError)
  }

  // Query 2: orders with subscriptions but missing delivery info
  const { data: missingDeliveryOrders, error: deliveryError } = await supabaseAdmin
    .from("orders")
    .select(`
      *,
      profiles:user_id (
        email,
        full_name
      )
    `)
    .not("stripe_subscription_id", "is", null)
    .is("delivery_zipcode", null)
    .not("fulfillment_status", "in", "(delivered,cancelled,failed)")
    .order("created_at", { ascending: false })

  if (deliveryError) {
    console.error("Error fetching missing delivery orders:", deliveryError)
  }

  // Merge and deduplicate by order ID
  const allOrders = [...(checkoutOrders || []), ...(missingDeliveryOrders || [])]
  const uniqueOrders = Array.from(
    new Map(allOrders.map(order => [order.id, order])).values()
  )

  // Sort by created_at descending
  uniqueOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return uniqueOrders
}

export default async function IncompleteOrdersPage() {
  const orders = await getIncompleteOrders()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Incomplete Orders - Sales Follow-Up</h1>
        <p className="text-gray-600 mt-2">
          {orders.length} orders needing follow-up
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Includes checkout in progress and orders missing delivery information
        </p>
      </div>

      <IncompleteOrdersTable orders={orders} />
    </div>
  )
}
