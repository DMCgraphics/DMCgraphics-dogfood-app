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

    // Check if user has admin or sales_manager role
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles, is_admin")
      .eq("id", user.id)
      .single()

    const isAuthorized = profile?.is_admin ||
      profile?.roles?.includes("sales_manager")

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { leadId, assignedTo } = await request.json()

    if (!leadId) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 })
    }

    // Update lead assignment
    const { data, error } = await supabase
      .from("sales_leads")
      .update({
        assigned_to: assignedTo,
        assigned_at: assignedTo ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)
      .select()
      .single()

    if (error) {
      console.error("Error assigning lead:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    if (assignedTo) {
      await supabase.from("sales_activities").insert({
        lead_id: leadId,
        activity_type: "status_change",
        description: `Lead assigned to team member`,
        performed_by: user.id,
        completed: true,
        completed_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Error in assign-lead API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
