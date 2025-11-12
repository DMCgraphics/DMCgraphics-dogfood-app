import { createServerSupabase } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DeliveryEmailButton } from "@/components/delivery/delivery-email-button"
import { Truck, Package } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function checkDeliveryDriver() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user has delivery_driver role
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("roles")
    .eq("id", user.id)
    .single()

  if (!profile?.roles || !profile.roles.includes('delivery_driver')) {
    redirect("/")
  }

  return user
}

async function getDeliveries() {
  const supabase = supabaseAdmin

  // Get active plans with delivery information
  const { data: plans, error } = await supabase
    .from("plans")
    .select("*")
    .eq("status", "active")
    .not("delivery_zipcode", "is", null)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching deliveries:", error)
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
    .select("id, name, breed")
    .in("id", dogIds)

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds)

  // Combine the data
  const deliveries = plans.map(plan => ({
    ...plan,
    plan_items: planItems?.filter(item => item.plan_id === plan.id) || [],
    dog: dogs?.find(dog => dog.id === plan.dog_id) || null,
    customer: profiles?.find(profile => profile.id === plan.user_id) || null
  }))

  return deliveries
}

export default async function DeliveryPage() {
  await checkDeliveryDriver()
  const deliveries = await getDeliveries()

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Truck className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Delivery Management</h1>
              <p className="text-gray-600 mt-1">{deliveries.length} active deliveries</p>
            </div>
          </div>

          <div className="grid gap-4">
            {deliveries.map((delivery) => {
              const dog = delivery.dog
              const customer = delivery.customer
              const planItems = delivery.plan_items || []

              return (
                <Card key={delivery.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Delivery for {dog?.name || "Unknown Dog"}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          Customer: {customer?.full_name || "Unknown"} ({customer?.email || "No email"})
                        </CardDescription>
                      </div>
                      <DeliveryEmailButton
                        customerEmail={customer?.email || ""}
                        customerName={customer?.full_name || "Customer"}
                        dogName={dog?.name || "your dog"}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Delivery Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Delivery ZIP</div>
                          <div className="text-lg font-bold">
                            {delivery.delivery_zipcode || "Not set"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Delivery Address</div>
                          <div className="text-sm">
                            {delivery.delivery_address_line1 || "Not set"}
                            {delivery.delivery_address_line2 && (
                              <div className="text-xs text-gray-500">
                                {delivery.delivery_address_line2}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Dog</div>
                          <div className="text-sm font-medium">
                            {dog?.breed || "Unknown breed"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Status</div>
                          <Badge className="bg-green-100 text-green-800">
                            {delivery.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Items */}
                      {planItems.length > 0 && (
                        <div className="border-t pt-4">
                          <div className="text-sm font-medium mb-2">Items to Deliver:</div>
                          <div className="space-y-1">
                            {planItems.map((item: any) => (
                              <div key={item.id} className="text-sm text-gray-600 flex justify-between">
                                <span>• {item.recipes?.name || "Unknown item"}</span>
                                <span className="font-medium">Qty: {item.qty}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {deliveries.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No active deliveries at this time</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
