import { supabaseAdmin } from "@/lib/supabase/server"
import { OrdersTable } from "@/components/admin/orders-table"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function getOrders() {
  // Use admin client to bypass RLS
  const supabase = supabaseAdmin

  // Get plans
  const { data: plans, error } = await supabase
    .from("plans")
    .select("*")
    .in("status", ["active", "checkout_in_progress"])
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching orders:", error)
    return []
  }

  if (!plans || plans.length === 0) {
    return []
  }

  const planIds = plans.map(p => p.id)
  const dogIds = plans.map(p => p.dog_id).filter(Boolean)
  const userIds = plans.map(p => p.user_id).filter(Boolean)

  // Get related data
  const { data: planItems } = await supabase
    .from("plan_items")
    .select("*, recipes (name, slug)")
    .in("plan_id", planIds)

  const { data: dogs } = await supabase
    .from("dogs")
    .select("id, name, breed, weight")
    .in("id", dogIds)

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("id, plan_id, status, stripe_subscription_id, current_period_start, current_period_end")
    .in("plan_id", planIds)

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds)

  // Combine the data
  const ordersWithRelations = plans.map(plan => ({
    ...plan,
    plan_items: planItems?.filter(item => item.plan_id === plan.id) || [],
    dogs: dogs?.find(dog => dog.id === plan.dog_id) || null,
    subscriptions: subscriptions?.filter(sub => sub.plan_id === plan.id) || [],
    profiles: profiles?.find(profile => profile.id === plan.user_id) || null
  }))

  return ordersWithRelations
}

export default async function OrdersManagementPage() {
  const orders = await getOrders()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders Management</h1>
        <p className="text-gray-600 mt-2">{orders.length} total orders</p>
      </div>

      <OrdersTable orders={orders} />
    </div>
  )
}
