import { supabaseAdmin } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, Phone, Target, ArrowUpRight, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface LeadStats {
  total_leads: number
  new_leads: number
  hot_leads: number
  contacted_this_week: number
  conversion_rate: number
  leads_by_source: { source: string; count: number }[]
  leads_by_status: { status: string; count: number }[]
  recent_leads: any[]
  pending_followups: number
}

async function getLeadStats(): Promise<LeadStats> {
  // Get total leads
  const { data: allLeads, error } = await supabaseAdmin
    .from("sales_leads")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching leads:", error)
    return {
      total_leads: 0,
      new_leads: 0,
      hot_leads: 0,
      contacted_this_week: 0,
      conversion_rate: 0,
      leads_by_source: [],
      leads_by_status: [],
      recent_leads: [],
      pending_followups: 0,
    }
  }

  const leads = allLeads || []

  // Calculate stats
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const stats = {
    total_leads: leads.length,
    new_leads: leads.filter(l => l.status === 'new').length,
    hot_leads: leads.filter(l => l.priority === 'hot').length,
    contacted_this_week: leads.filter(l => {
      if (!l.last_contacted_at) return false
      const contactDate = new Date(l.last_contacted_at)
      return contactDate >= oneWeekAgo
    }).length,
    conversion_rate: leads.length > 0
      ? Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100)
      : 0,
    pending_followups: leads.filter(l => {
      if (!l.next_follow_up_at) return false
      const followUpDate = new Date(l.next_follow_up_at)
      return followUpDate <= now && l.status !== 'converted' && l.status !== 'lost'
    }).length,
  }

  // Group by source
  const sourceMap = new Map<string, number>()
  leads.forEach(lead => {
    sourceMap.set(lead.source, (sourceMap.get(lead.source) || 0) + 1)
  })
  const leads_by_source = Array.from(sourceMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)

  // Group by status
  const statusMap = new Map<string, number>()
  leads.forEach(lead => {
    statusMap.set(lead.status, (statusMap.get(lead.status) || 0) + 1)
  })
  const leads_by_status = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)

  // Get recent leads (last 5)
  const recent_leads = leads.slice(0, 5)

  return {
    ...stats,
    leads_by_source,
    leads_by_status,
    recent_leads,
  }
}

function formatSource(source: string): string {
  const sourceMap: Record<string, string> = {
    event_signup: 'Event Raffle',
    early_access: 'Early Access',
    abandoned_plan: 'Abandoned Plan',
    incomplete_checkout: 'Incomplete Checkout',
    individual_pack: 'Individual Pack',
    contact_form: 'Contact Form',
    medical_request: 'Medical Request',
    manual: 'Manual Entry',
  }
  return sourceMap[source] || source
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    nurturing: 'Nurturing',
    converted: 'Converted',
    lost: 'Lost',
    spam: 'Spam',
  }
  return statusMap[status] || status
}

function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-purple-100 text-purple-800',
    qualified: 'bg-green-100 text-green-800',
    nurturing: 'bg-yellow-100 text-yellow-800',
    converted: 'bg-emerald-100 text-emerald-800',
    lost: 'bg-gray-100 text-gray-800',
    spam: 'bg-red-100 text-red-800',
  }
  return colorMap[status] || 'bg-gray-100 text-gray-800'
}

function getPriorityColor(priority: string): string {
  const colorMap: Record<string, string> = {
    hot: 'bg-red-100 text-red-800',
    warm: 'bg-orange-100 text-orange-800',
    cold: 'bg-blue-100 text-blue-800',
  }
  return colorMap[priority] || 'bg-gray-100 text-gray-800'
}

export default async function SalesDashboardPage() {
  const stats = await getLeadStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Overview of leads, pipeline, and team performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/sales/leads">View All Leads</Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_leads}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.new_leads} new leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
            <Target className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hot_leads}</div>
            <p className="text-xs text-muted-foreground mt-1">
              High priority opportunities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacted This Week</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contacted_this_week}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversion_rate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Leads to customers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Follow-ups Alert */}
      {stats.pending_followups > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">
                  {stats.pending_followups} {stats.pending_followups === 1 ? 'lead needs' : 'leads need'} follow-up
                </p>
                <p className="text-sm text-orange-700">
                  Scheduled follow-ups are overdue. Review and contact these leads.
                </p>
              </div>
              <Button asChild variant="outline" className="ml-auto">
                <Link href="/admin/sales/leads?filter=followup">View Follow-ups</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions & Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/sales/incomplete-orders">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Incomplete Orders ({stats.leads_by_source.find(s => s.source === 'incomplete_checkout')?.count || 0})
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/sales/event-signups">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Event Signups ({stats.leads_by_source.find(s => s.source === 'event_signup')?.count || 0})
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/sales/leads?status=new">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                New Leads ({stats.new_leads})
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/sales/leads?priority=hot">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Hot Leads ({stats.hot_leads})
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Leads by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.leads_by_status.map(({ status, count }) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={getStatusColor(status)}>
                      {formatStatus(status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{count}</span>
                    <span className="text-xs text-muted-foreground">
                      ({Math.round((count / stats.total_leads) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leads by Source */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.leads_by_source.map(({ source, count }) => (
                <div key={source} className="flex items-center justify-between">
                  <span className="text-sm">{formatSource(source)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{count}</span>
                    <span className="text-xs text-muted-foreground">
                      ({Math.round((count / stats.total_leads) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recent_leads.length === 0 ? (
                <p className="text-sm text-muted-foreground">No leads yet</p>
              ) : (
                stats.recent_leads.map((lead) => (
                  <div key={lead.id} className="flex items-start justify-between border-b pb-3 last:border-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{lead.email}</p>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className={getPriorityColor(lead.priority)}>
                          {lead.priority}
                        </Badge>
                        <Badge variant="secondary" className={getStatusColor(lead.status)}>
                          {formatStatus(lead.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatSource(lead.source)} • {new Date(lead.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {stats.recent_leads.length > 0 && (
              <Button asChild variant="link" className="w-full mt-4">
                <Link href="/admin/sales/leads">View All Leads →</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
