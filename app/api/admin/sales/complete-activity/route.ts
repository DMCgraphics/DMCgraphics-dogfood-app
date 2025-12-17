import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { activityId } = await request.json()

  if (!activityId) {
    return NextResponse.json({ error: "Activity ID is required" }, { status: 400 })
  }

  // Update the activity to mark as completed
  const { error } = await supabase
    .from("sales_activities")
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq("id", activityId)
    .eq("performed_by", user.id) // Ensure user can only complete their own activities

  if (error) {
    console.error("Error completing activity:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
