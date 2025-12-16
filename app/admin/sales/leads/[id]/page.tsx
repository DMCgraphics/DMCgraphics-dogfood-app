import { supabaseAdmin } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { LeadDetailView } from "@/components/admin/sales/lead-detail-view"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function getLead(id: string) {
  const { data: lead, error } = await supabaseAdmin
    .from("sales_leads")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !lead) {
    return null
  }

  // Fetch assigned user if exists
  if (lead.assigned_to) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", lead.assigned_to)
      .single()

    return {
      ...lead,
      assigned_to_user: profile ? { ...profile, profiles: { full_name: profile.full_name } } : null
    }
  }

  return lead
}

async function getActivities(leadId: string) {
  const { data: activities } = await supabaseAdmin
    .from("sales_activities")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })

  if (!activities || activities.length === 0) {
    return []
  }

  // Get unique performed_by user IDs
  const performedByIds = [...new Set(activities.filter(a => a.performed_by).map(a => a.performed_by))]

  if (performedByIds.length === 0) {
    return activities
  }

  // Fetch user data from profiles
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name")
    .in("id", performedByIds)

  // Create a map for quick lookup
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

  // Merge the data
  const enrichedActivities = activities.map(activity => ({
    ...activity,
    performed_by_user: activity.performed_by ? {
      id: activity.performed_by,
      email: profileMap.get(activity.performed_by)?.email,
      profiles: { full_name: profileMap.get(activity.performed_by)?.full_name }
    } : null
  }))

  return enrichedActivities
}

async function getSalesTeam() {
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, roles")
    .or("roles.cs.{sales_manager},roles.cs.{sales_rep}")

  return profiles || []
}

export default async function LeadDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const lead = await getLead(params.id)

  if (!lead) {
    notFound()
  }

  const [activities, salesTeam] = await Promise.all([
    getActivities(params.id),
    getSalesTeam(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/sales/leads">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Link>
        </Button>
      </div>

      <LeadDetailView lead={lead} activities={activities} salesTeam={salesTeam} />
    </div>
  )
}
