import { supabaseAdmin } from "@/lib/supabase/server"
import { LeadsTable } from "@/components/admin/sales/leads-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function getLeads() {
  // Fetch all leads
  const { data: leads, error } = await supabaseAdmin
    .from("sales_leads")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching leads:", error)
    return []
  }

  if (!leads || leads.length === 0) {
    return []
  }

  // Get unique assigned_to user IDs
  const assignedUserIds = [...new Set(leads.filter(l => l.assigned_to).map(l => l.assigned_to))]

  if (assignedUserIds.length === 0) {
    return leads
  }

  // Fetch assigned user data from profiles
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name")
    .in("id", assignedUserIds)

  // Create a map for quick lookup
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

  // Merge the data
  const enrichedLeads = leads.map(lead => ({
    ...lead,
    assigned_to_user: lead.assigned_to ? profileMap.get(lead.assigned_to) : null
  }))

  return enrichedLeads
}

async function getSalesTeam() {
  // Get all users with sales_manager or sales_rep roles
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, roles")
    .or("roles.cs.{sales_manager},roles.cs.{sales_rep}")

  return profiles || []
}

export default async function LeadsPage() {
  const leads = await getLeads()
  const salesTeam = await getSalesTeam()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/admin/sales">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">All Leads</h1>
          <p className="text-gray-600 mt-2">
            {leads.length} total leads
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/sales/leads/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Manual Lead
          </Link>
        </Button>
      </div>

      <LeadsTable leads={leads} salesTeam={salesTeam} />
    </div>
  )
}
