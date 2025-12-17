import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MyLeadsTable } from "@/components/sales/my-leads-table"
import { FollowUpReminders } from "@/components/sales/follow-up-reminders"
import { QuickActions } from "@/components/sales/quick-actions"
import { Clock, Target, TrendingUp, Users } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface Lead {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  source: string
  status: string
  priority: string
  last_contacted_at: string | null
  conversion_probability: number
  notes: string | null
  created_at: string
}

interface Activity {
  id: string
  lead_id: string
  activity_type: string
  subject: string | null
  description: string | null
  scheduled_for: string | null
  completed: boolean
  created_at: string
}

async function getMyLeads(userId: string) {
  const supabase = await createClient()

  const { data: leads, error } = await supabase
    .from("sales_leads")
    .select("*")
    .eq("assigned_to", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching my leads:", error)
    return []
  }

  return leads as Lead[]
}

async function getMyActivities(userId: string) {
  const supabase = await createClient()

  const { data: activities, error } = await supabase
    .from("sales_activities")
    .select("*")
    .eq("performed_by", userId)
    .eq("completed", false)
    .not("scheduled_for", "is", null)
    .order("scheduled_for", { ascending: true })

  if (error) {
    console.error("Error fetching my activities:", error)
    return []
  }

  return activities as Activity[]
}

interface Stats {
  my_leads: number
  hot_leads: number
  contacted_this_week: number
  pending_followups: number
}

async function getMyStats(userId: string, leads: Lead[], activities: Activity[]): Promise<Stats> {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const contactedThisWeek = leads.filter(l => {
    if (!l.last_contacted_at) return false
    return new Date(l.last_contacted_at) >= weekAgo
  }).length

  const hotLeads = leads.filter(l => l.priority === 'hot').length

  const pendingFollowups = activities.filter(a => {
    if (!a.scheduled_for) return false
    return new Date(a.scheduled_for) <= now
  }).length

  return {
    my_leads: leads.length,
    hot_leads: hotLeads,
    contacted_this_week: contactedThisWeek,
    pending_followups: pendingFollowups
  }
}

export default async function SalesRepDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user has sales role
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles")
    .eq("id", user.id)
    .single()

  const roles = profile?.roles || []
  const hasSalesAccess = roles.includes("admin") || roles.includes("sales_manager") || roles.includes("sales_rep")

  if (!hasSalesAccess) {
    redirect("/dashboard")
  }

  const leads = await getMyLeads(user.id)
  const activities = await getMyActivities(user.id)
  const stats = await getMyStats(user.id, leads, activities)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Sales Dashboard</h1>
        <p className="text-muted-foreground">Manage your leads and follow-ups</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.my_leads}</div>
            <p className="text-xs text-muted-foreground">Total assigned to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
            <Target className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hot_leads}</div>
            <p className="text-xs text-muted-foreground">High priority leads</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacted This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contacted_this_week}</div>
            <p className="text-xs text-muted-foreground">Active outreach</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Follow-ups</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_followups}</div>
            <p className="text-xs text-muted-foreground">Due now or overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Follow-up Reminders */}
      {activities.length > 0 && (
        <div className="mb-8">
          <FollowUpReminders activities={activities} />
        </div>
      )}

      {/* My Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Leads</CardTitle>
          <CardDescription>All leads assigned to you</CardDescription>
        </CardHeader>
        <CardContent>
          <MyLeadsTable leads={leads} />
        </CardContent>
      </Card>

      {/* Quick Actions FAB */}
      <QuickActions />
    </div>
  )
}
