import { supabaseAdmin } from "@/lib/supabase/server"
import { IncompleteOrdersTable } from "@/components/admin/incomplete-orders-table"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function getIncompleteOrders() {
  // Get incomplete items for sales follow-up:
  // 1. Draft/checkout_in_progress PLANS (customers who built plans but didn't checkout)
  // 2. Confirmed ORDERS missing delivery info (customers who paid but need address)

  // Query 1: Draft or checkout_in_progress plans (not yet converted to orders)
  const { data: draftPlans, error: plansError } = await supabaseAdmin
    .from("plans")
    .select(`
      id,
      status,
      total_cents,
      created_at,
      delivery_zipcode,
      stripe_session_id,
      profiles:user_id (
        email,
        full_name
      ),
      dogs:dog_id (
        name
      )
    `)
    .in("status", ["draft", "checkout_in_progress"])
    .order("created_at", { ascending: false })

  if (plansError) {
    console.error("Error fetching draft plans:", plansError)
  }

  // Query 2: Orders with subscriptions but missing delivery info
  const { data: missingDeliveryOrders, error: ordersError } = await supabaseAdmin
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

  if (ordersError) {
    console.error("Error fetching orders:", ordersError)
  }

  // Transform draft plans to match orders structure
  const transformedPlans = (draftPlans || []).map(plan => ({
    id: plan.id,
    order_number: `PLAN-${plan.id.substring(0, 8)}`,
    status: plan.status,
    total_cents: plan.total_cents,
    created_at: plan.created_at,
    delivery_zipcode: plan.delivery_zipcode,
    stripe_subscription_id: null,
    fulfillment_status: 'pending',
    profiles: plan.profiles,
    customer_name: plan.dogs?.name ? `${plan.dogs.name}'s Owner` : null,
    guest_email: null,
    is_plan: true, // Flag to identify this is from plans table
  }))

  // Merge plans and orders
  const allItems = [...transformedPlans, ...(missingDeliveryOrders || [])]

  // Sort by created_at descending
  allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return allItems
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
