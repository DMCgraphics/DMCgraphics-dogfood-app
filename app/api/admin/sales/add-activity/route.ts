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

    const { leadId, activityType, subject, description, scheduledFor } = await request.json()

    if (!leadId || !activityType || !description) {
      return NextResponse.json(
        { error: "Lead ID, activity type, and description are required" },
        { status: 400 }
      )
    }

    const validActivityTypes = ['email', 'call', 'note', 'meeting', 'text', 'task', 'status_change']
    if (!validActivityTypes.includes(activityType)) {
      return NextResponse.json({ error: "Invalid activity type" }, { status: 400 })
    }

    // Determine if activity is completed (not scheduled for future)
    const isScheduled = scheduledFor && new Date(scheduledFor) > new Date()
    const completed = !isScheduled
    const completedAt = completed ? new Date().toISOString() : null

    // Insert activity
    const { data, error } = await supabase
      .from("sales_activities")
      .insert({
        lead_id: leadId,
        activity_type: activityType,
        subject: subject || null,
        description,
        scheduled_for: scheduledFor || null,
        performed_by: user.id,
        completed,
        completed_at: completedAt,
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding activity:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Error in add-activity API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
