import { supabaseAdmin } from "@/lib/supabase/server"
import { EventSignupsTable } from "@/components/admin/sales/event-signups-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function getEventSignups() {
  const { data: signups, error } = await supabaseAdmin
    .from("event_signups")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching event signups:", error)
    return []
  }

  return signups || []
}

async function getLeads() {
  // Get all leads from event signups to check which have been converted
  const { data: leads } = await supabaseAdmin
    .from("sales_leads")
    .select("email, source_metadata")
    .eq("source", "event_signup")

  return leads || []
}

export default async function EventSignupsPage() {
  const [signups, leads] = await Promise.all([
    getEventSignups(),
    getLeads(),
  ])

  // Create a map of emails that have been converted to leads
  const convertedEmails = new Set(leads.map(l => l.email))

  // Enrich signups with conversion status
  const enrichedSignups = signups.map(signup => ({
    ...signup,
    converted_to_lead: convertedEmails.has(signup.email)
  }))

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/sales">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Event Signups</h1>
        <p className="text-gray-600 mt-2">
          {signups.length} total signups • {leads.length} converted to leads
        </p>
      </div>

      <EventSignupsTable signups={enrichedSignups} />
    </div>
  )
}
