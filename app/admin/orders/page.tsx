import { supabaseAdmin } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Calendar, DollarSign } from "lucide-react"

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
        <p className="text-gray-600 mt-2">{orders.length} active orders</p>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => {
          const subscription = order.subscriptions?.[0]
          const dog = order.dogs
          const profile = order.profiles
          const planItems = order.plan_items || []

          return (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Order for {dog?.name || "Unknown Dog"}
                      <Badge
                        className={
                          order.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {order.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Customer: {profile?.full_name || "Unknown"} • Created{" "}
                      {new Date(order.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      ${((order.total_cents || 0) / 100).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">per week</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Order Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        Plan Items
                      </div>
                      <div className="text-lg font-bold">{planItems.length}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Delivery ZIP
                      </div>
                      <div className="text-lg font-bold">
                        {order.delivery_zipcode || "Not set"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Dog</div>
                      <div className="text-sm font-medium">
                        {dog?.breed} • {dog?.weight} lbs
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Subscription</div>
                      <div className="text-sm">
                        {subscription ? (
                          <Badge
                            className={
                              subscription.status === "active"
                                ? "bg-green-100 text-green-800"
                                : subscription.status === "paused"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {subscription.status}
                          </Badge>
                        ) : (
                          <span className="text-gray-500">No subscription</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recipe Details */}
                  {planItems.length > 0 && (
                    <div className="border-t pt-4">
                      <div className="text-sm font-medium mb-2">Recipes:</div>
                      <div className="space-y-1">
                        {planItems.map((item: any) => (
                          <div key={item.id} className="text-sm text-gray-600 flex justify-between">
                            <span>• {item.recipes?.name || "Unknown recipe"}</span>
                            <span className="font-medium">
                              ${((item.unit_price_cents || 0) / 100).toFixed(2)} × {item.qty}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stripe Info */}
                  {subscription?.stripe_subscription_id && (
                    <div className="border-t pt-4">
                      <div className="text-xs text-gray-500 font-mono">
                        Stripe: {subscription.stripe_subscription_id}
                      </div>
                      {subscription.current_period_end && (
                        <div className="text-xs text-gray-500">
                          Next billing:{" "}
                          {new Date(subscription.current_period_end).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {orders.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No active orders found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
