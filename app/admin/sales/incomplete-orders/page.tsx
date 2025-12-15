import { supabaseAdmin } from "@/lib/supabase/server"
import { IncompleteOrdersTable } from "@/components/admin/incomplete-orders-table"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function getIncompleteOrders() {
  // Get orders with payment info but missing delivery details
  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        email
      )
    `)
    .not("stripe_subscription_id", "is", null)
    .is("delivery_zipcode", null)
    .not("fulfillment_status", "in", '("delivered","cancelled","failed")')
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching incomplete orders:", error)
    return []
  }

  return orders || []
}

export default async function IncompleteOrdersPage() {
  const orders = await getIncompleteOrders()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Incomplete Orders - Sales Follow-Up</h1>
        <p className="text-gray-600 mt-2">
          {orders.length} paid subscriptions missing delivery information
        </p>
        <p className="text-sm text-gray-500 mt-1">
          These customers have active subscriptions but haven't provided delivery details yet
        </p>
      </div>

      <IncompleteOrdersTable orders={orders} />
    </div>
  )
}
