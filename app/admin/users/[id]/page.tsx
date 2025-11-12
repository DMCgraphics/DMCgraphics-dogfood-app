import { supabaseAdmin } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Mail, Calendar, Shield, Dog, CreditCard, Package } from "lucide-react"
import { notFound } from "next/navigation"
import { ManageUserRoles } from "@/components/admin/manage-user-roles"
import { DeleteUserButton } from "@/components/admin/delete-user-button"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function getUserDetails(userId: string) {
  const supabase = supabaseAdmin

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  if (profileError || !profile) {
    return null
  }

  // Get user's dogs
  const { data: dogs } = await supabase
    .from("dogs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  // Get user's subscriptions
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  // Get user's orders
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  return {
    profile,
    dogs: dogs || [],
    subscriptions: subscriptions || [],
    orders: orders || []
  }
}

export default async function UserDetailsPage({ params }: { params: { id: string } }) {
  const userDetails = await getUserDetails(params.id)

  if (!userDetails) {
    notFound()
  }

  const { profile, dogs, subscriptions, orders } = userDetails
  const activeSubscriptions = subscriptions.filter((sub: any) => sub.status === "active")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {profile.full_name || "No name"}
              {profile.is_admin && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
            </h1>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {profile.id}
            </p>
          </div>
        </div>
        <DeleteUserButton userId={profile.id} userName={profile.full_name || profile.id} />
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">User ID</div>
              <div className="font-mono text-sm">{profile.id}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Full Name</div>
              <div>{profile.full_name || "Not set"}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Created At</div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(profile.created_at).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Updated At</div>
              <div>{new Date(profile.updated_at).toLocaleString()}</div>
            </div>
          </div>

          <div className="border-t pt-4">
            <ManageUserRoles
              userId={profile.id}
              currentRoles={profile.roles || []}
              userName={profile.full_name || profile.id}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dogs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dog className="h-5 w-5" />
            Dogs ({dogs.length})
          </CardTitle>
          <CardDescription>All registered dogs for this user</CardDescription>
        </CardHeader>
        <CardContent>
          {dogs.length > 0 ? (
            <div className="space-y-4">
              {dogs.map((dog: any) => (
                <div key={dog.id} className="border rounded-lg p-4">
                  <div className="font-semibold">{dog.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {dog.breed} • {dog.weight} {dog.weight_unit || "lbs"}
                  </div>
                  <div className="text-sm text-gray-600">
                    Age: {dog.age_years} years {dog.age_months} months
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Created: {new Date(dog.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">No dogs registered</p>
          )}
        </CardContent>
      </Card>

      {/* Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscriptions ({subscriptions.length})
          </CardTitle>
          <CardDescription>
            {activeSubscriptions.length} active subscription{activeSubscriptions.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length > 0 ? (
            <div className="space-y-4">
              {subscriptions.map((sub: any) => (
                <div key={sub.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">Subscription #{sub.id.substring(0, 8)}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Stripe ID: {sub.stripe_subscription_id || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Created: {new Date(sub.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge
                      className={
                        sub.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {sub.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">No subscriptions</p>
          )}
        </CardContent>
      </Card>

      {/* Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Orders ({orders.length})
          </CardTitle>
          <CardDescription>Order history</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">Order #{order.id.substring(0, 8)}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        ${(order.total / 100).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Created: {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge>{order.status || "pending"}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">No orders</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
