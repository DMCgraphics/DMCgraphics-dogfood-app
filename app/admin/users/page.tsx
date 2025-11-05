import { createServerSupabase, supabaseAdmin } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ExternalLink, Mail, Calendar, Shield } from "lucide-react"
import { CreateUserDialog } from "@/components/admin/create-user-dialog"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function getUsers() {
  // Use admin client to bypass RLS
  const supabase = supabaseAdmin

  // Get all profiles
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  if (profileError) {
    console.error("Error fetching profiles:", profileError)
    return []
  }

  if (!profiles || profiles.length === 0) {
    return []
  }

  // Get all subscriptions
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("id, user_id, status, stripe_subscription_id, created_at")

  // Get all dogs
  const { data: dogs } = await supabase
    .from("dogs")
    .select("id, user_id, name")

  // Combine the data
  const users = profiles.map(profile => ({
    ...profile,
    subscriptions: subscriptions?.filter(sub => sub.user_id === profile.id) || [],
    dogs: dogs?.filter(dog => dog.user_id === profile.id) || []
  }))

  return users
}

export default async function UsersManagementPage() {
  const users = await getUsers()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-gray-600 mt-2">{users.length} total users</p>
        </div>
        <CreateUserDialog />
      </div>

      <div className="grid gap-4">
        {users.map((user) => {
          const activeSubscriptions = user.subscriptions?.filter(
            (sub: any) => sub.status === "active"
          ) || []
          const totalSubscriptions = user.subscriptions?.length || 0
          const totalDogs = user.dogs?.length || 0

          return (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {user.full_name || "No name"}
                      {user.is_admin && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.id}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </CardDescription>
                  </div>
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="inline-flex"
                  >
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Subscriptions</div>
                    <div className="text-2xl font-bold">
                      {activeSubscriptions.length}
                      <span className="text-sm text-gray-600 font-normal">
                        {" "}/ {totalSubscriptions}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">active / total</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Dogs</div>
                    <div className="text-2xl font-bold">{totalDogs}</div>
                    <div className="text-xs text-gray-500">registered</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <div className="mt-1">
                      {activeSubscriptions.length > 0 ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : totalSubscriptions > 0 ? (
                        <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800">New</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">No users found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
