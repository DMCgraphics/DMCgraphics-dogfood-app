import { NewLeadForm } from "@/components/admin/sales/new-lead-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { supabaseAdmin } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function getSalesTeam() {
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, roles")
    .or("roles.cs.{sales_manager},roles.cs.{sales_rep}")

  return profiles || []
}

export default async function NewLeadPage() {
  const salesTeam = await getSalesTeam()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/sales/leads">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Add Manual Lead</h1>
        <p className="text-gray-600 mt-2">
          Manually create a new sales lead
        </p>
      </div>

      <NewLeadForm salesTeam={salesTeam} />
    </div>
  )
}
