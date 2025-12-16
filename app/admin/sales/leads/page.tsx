import { supabaseAdmin } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function LeadsPage() {
  const { data: leads } = await supabaseAdmin
    .from("sales_leads")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/sales">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">All Leads</h1>
        <p className="text-gray-600 mt-2">
          {leads?.length || 0} total leads
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="font-semibold text-yellow-900 mb-2">Coming Soon</h2>
        <p className="text-yellow-800">
          Full leads management interface with filtering, assignment, and activity tracking will be available here.
        </p>
      </div>
    </div>
  )
}
