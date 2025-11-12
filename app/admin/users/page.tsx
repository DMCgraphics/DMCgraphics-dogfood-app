import { supabaseAdmin } from "@/lib/supabase/server"
import { CreateUserDialog } from "@/components/admin/create-user-dialog"
import { UsersTable } from "@/components/admin/users-table"

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

      <UsersTable users={users} />
    </div>
  )
}
