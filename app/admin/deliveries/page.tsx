import { supabaseAdmin } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, Package, MapPin, Calendar } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function getDeliveryBatches() {
  // Use admin client to bypass RLS
  const supabase = supabaseAdmin

  // Get all active subscriptions
  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select("id, status, current_period_end, stripe_subscription_id, plan_id, user_id")
    .eq("status", "active")
    .order("current_period_end", { ascending: true })

  if (error) {
    console.error("Error fetching deliveries:", error)
    return {}
  }

  if (!subscriptions || subscriptions.length === 0) {
    return {}
  }

  const planIds = subscriptions.map(s => s.plan_id).filter(Boolean)
  const userIds = subscriptions.map(s => s.user_id).filter(Boolean)

  // Get related data
  const { data: plans } = await supabase
    .from("plans")
    .select("id, delivery_zipcode, total_cents, dog_id")
    .in("id", planIds)

  const { data: planItems } = await supabase
    .from("plan_items")
    .select("id, plan_id, qty, recipe_id")
    .in("plan_id", planIds)

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds)

  const dogIds = plans?.map(p => p.dog_id).filter(Boolean) || []
  const { data: dogs } = await supabase
    .from("dogs")
    .select("id, name, weight")
    .in("id", dogIds)

  // Combine the data
  const subscriptionsWithData = subscriptions.map(sub => {
    const plan = plans?.find(p => p.id === sub.plan_id)
    const dog = plan ? dogs?.find(d => d.id === plan.dog_id) : null
    const profile = profiles?.find(p => p.id === sub.user_id)
    const items = planItems?.filter(item => item.plan_id === sub.plan_id) || []

    return {
      ...sub,
      plans: plan ? {
        ...plan,
        dogs: dog,
        plan_items: items
      } : null,
      profiles: profile
    }
  }).filter(sub => sub.plans !== null)

  // Group by ZIP code and delivery date (week)
  const batches: Record<string, any[]> = {}

  subscriptionsWithData.forEach((sub: any) => {
    const zipCode = sub.plans?.delivery_zipcode || "Unknown"
    const deliveryDate = sub.current_period_end
      ? new Date(sub.current_period_end).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "No date"

    const key = `${zipCode}-${deliveryDate}`

    if (!batches[key]) {
      batches[key] = []
    }

    batches[key].push({
      ...sub,
      deliveryDate,
      zipCode,
    })
  })

  return batches
}

export default async function DeliveriesManagementPage() {
  const batches = await getDeliveryBatches()
  const batchKeys = Object.keys(batches).sort()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Deliveries & Batches</h1>
        <p className="text-gray-600 mt-2">{batchKeys.length} delivery batches</p>
      </div>

      <div className="grid gap-6">
        {batchKeys.map((batchKey) => {
          const deliveries = batches[batchKey]
          const firstDelivery = deliveries[0]
          const zipCode = firstDelivery.zipCode
          const deliveryDate = firstDelivery.deliveryDate

          // Calculate totals
          const totalOrders = deliveries.length
          const totalWeight = deliveries.reduce((sum, d) => {
            return sum + (d.plans?.dogs?.weight || 0)
          }, 0)
          const totalAmount = deliveries.reduce((sum, d) => {
            return sum + (d.plans?.total_cents || 0)
          }, 0)

          return (
            <Card key={batchKey}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Batch: {zipCode} - {deliveryDate}
                    </CardTitle>
                    <CardDescription>
                      {totalOrders} orders • ${(totalAmount / 100).toFixed(2)} total revenue
                    </CardDescription>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    {totalOrders} orders
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Batch Summary */}
                  <div className="grid grid-cols-3 gap-4 pb-4 border-b">
                    <div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        ZIP Code
                      </div>
                      <div className="text-lg font-bold">{zipCode}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Delivery Date
                      </div>
                      <div className="text-lg font-bold">{deliveryDate}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        Total Weight
                      </div>
                      <div className="text-lg font-bold">{totalWeight} lbs</div>
                    </div>
                  </div>

                  {/* Individual Orders */}
                  <div>
                    <div className="text-sm font-medium mb-2">Orders in this batch:</div>
                    <div className="space-y-2">
                      {deliveries.map((delivery: any) => (
                        <div
                          key={delivery.id}
                          className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-medium">
                              {delivery.plans?.dogs?.name || "Unknown Dog"}
                            </span>
                            <span className="text-gray-600">
                              ({delivery.plans?.dogs?.weight || 0} lbs)
                            </span>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-600">
                              {delivery.profiles?.full_name || "Unknown"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">
                              ${((delivery.plans?.total_cents || 0) / 100).toFixed(2)}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {delivery.plans?.plan_items?.length || 0} items
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {batchKeys.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No upcoming deliveries</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
