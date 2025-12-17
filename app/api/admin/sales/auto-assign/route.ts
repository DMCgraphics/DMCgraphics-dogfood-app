import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { batchAssignLeads } from "@/lib/sales/auto-assignment"

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user is admin or sales_manager
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles")
    .eq("id", user.id)
    .single()

  const roles = profile?.roles || []
  const hasPermission = roles.includes("admin") || roles.includes("sales_manager")

  if (!hasPermission) {
    return NextResponse.json({ error: "Forbidden - Requires admin or sales_manager role" }, { status: 403 })
  }

  const body = await request.json()
  const { leadIds, strategy = 'round-robin', excludeManagers = false } = body

  if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
    return NextResponse.json({ error: "Lead IDs array is required" }, { status: 400 })
  }

  if (!['round-robin', 'workload', 'territory'].includes(strategy)) {
    return NextResponse.json({ error: "Invalid strategy. Must be: round-robin, workload, or territory" }, { status: 400 })
  }

  console.log(`[Auto-Assignment] Starting auto-assignment for ${leadIds.length} leads using ${strategy} strategy`)

  try {
    const result = await batchAssignLeads(supabase, leadIds, {
      type: strategy,
      options: { excludeManagers }
    })

    console.log(`[Auto-Assignment] Completed: ${result.success} successful, ${result.failed} failed`)

    return NextResponse.json({
      success: true,
      message: `Assigned ${result.success} leads successfully`,
      stats: {
        total: leadIds.length,
        success: result.success,
        failed: result.failed,
      },
      assignments: Object.fromEntries(result.assignments),
    })
  } catch (error) {
    console.error("[Auto-Assignment] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Auto-assignment failed" },
      { status: 500 }
    )
  }
}
