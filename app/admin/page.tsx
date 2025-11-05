import { supabaseAdmin } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Package, DollarSign, TrendingUp, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function getAdminStats() {
  // Use admin client to bypass RLS
  const supabase = supabaseAdmin

  // Get total users
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })

  // Get active subscriptions
  const { count: activeSubscriptions } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")

  // Get total dogs
  const { count: totalDogs } = await supabase
    .from("dogs")
    .select("*", { count: "exact", head: true })

  // Get total orders (plans with subscriptions)
  const { count: totalOrders } = await supabase
    .from("plans")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")

  // Get recent subscriptions (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { count: recentSubscriptions } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo.toISOString())

  // Get paused subscriptions
  const { count: pausedSubscriptions } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "paused")

  // Get past due subscriptions
  const { count: pastDueSubscriptions } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "past_due")

  return {
    totalUsers: totalUsers || 0,
    activeSubscriptions: activeSubscriptions || 0,
    totalDogs: totalDogs || 0,
    totalOrders: totalOrders || 0,
    recentSubscriptions: recentSubscriptions || 0,
    pausedSubscriptions: pausedSubscriptions || 0,
    pastDueSubscriptions: pastDueSubscriptions || 0,
  }
}

export default async function AdminDashboard() {
  const stats = await getAdminStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-gray-600 mt-2">Welcome to the NouriPet admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.recentSubscriptions} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dogs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDogs}</div>
            <p className="text-xs text-muted-foreground">Dogs with meal plans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Current meal plans</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {stats.pastDueSubscriptions > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {stats.pastDueSubscriptions} subscription{stats.pastDueSubscriptions > 1 ? "s are" : " is"} past due
          </AlertDescription>
        </Alert>
      )}

      {stats.pausedSubscriptions > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {stats.pausedSubscriptions} subscription{stats.pausedSubscriptions > 1 ? "s are" : " is"} currently paused
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>Breakdown of current subscriptions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Active</span>
              <span className="text-2xl font-bold text-green-600">{stats.activeSubscriptions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Paused</span>
              <span className="text-2xl font-bold text-yellow-600">{stats.pausedSubscriptions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Past Due</span>
              <span className="text-2xl font-bold text-red-600">{stats.pastDueSubscriptions}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">New Subscriptions</span>
              <span className="text-2xl font-bold text-blue-600">{stats.recentSubscriptions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Users</span>
              <span className="text-2xl font-bold">{stats.totalUsers}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
