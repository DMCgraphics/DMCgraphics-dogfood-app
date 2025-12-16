import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabase()

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin, sales_manager, or sales_rep role
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles, is_admin")
      .eq("id", user.id)
      .single()

    const isAuthorized = profile?.is_admin ||
      profile?.roles?.includes("sales_manager") ||
      profile?.roles?.includes("sales_rep")

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { leadId, status } = await request.json()

    if (!leadId || !status) {
      return NextResponse.json(
        { error: "Lead ID and status are required" },
        { status: 400 }
      )
    }

    const validStatuses = ['new', 'contacted', 'qualified', 'nurturing', 'converted', 'lost', 'spam']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Get current lead status
    const { data: currentLead } = await supabase
      .from("sales_leads")
      .select("status")
      .eq("id", leadId)
      .single()

    // Update lead status
    const { data, error } = await supabase
      .from("sales_leads")
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...(status === 'converted' && { converted_at: new Date().toISOString() }),
      })
      .eq("id", leadId)
      .select()
      .single()

    if (error) {
      console.error("Error updating lead status:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    await supabase.from("sales_activities").insert({
      lead_id: leadId,
      activity_type: "status_change",
      description: `Status changed from ${currentLead?.status} to ${status}`,
      performed_by: user.id,
      completed: true,
      completed_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Error in update-lead-status API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
