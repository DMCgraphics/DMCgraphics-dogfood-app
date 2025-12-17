import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { calculateLeadScore, scoreToPriority } from "@/lib/sales/lead-scoring"

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
  const { leadIds } = body

  // If no leadIds provided, rescore all leads
  let query = supabase.from("sales_leads").select("*")

  if (leadIds && Array.isArray(leadIds) && leadIds.length > 0) {
    query = query.in("id", leadIds)
  }

  const { data: leads, error: fetchError } = await query

  if (fetchError) {
    console.error("[Rescore] Error fetching leads:", fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!leads || leads.length === 0) {
    return NextResponse.json({ success: true, message: "No leads to rescore", updated: 0 })
  }

  console.log(`[Rescore] Rescoring ${leads.length} leads`)

  let updated = 0
  let failed = 0

  for (const lead of leads) {
    try {
      const newScore = calculateLeadScore(lead)
      const newPriority = scoreToPriority(newScore)

      // Only update if score or priority changed
      if (newScore !== lead.conversion_probability || newPriority !== lead.priority) {
        const { error: updateError } = await supabase
          .from("sales_leads")
          .update({
            conversion_probability: newScore,
            priority: newPriority,
          })
          .eq("id", lead.id)

        if (updateError) {
          console.error(`[Rescore] Error updating lead ${lead.id}:`, updateError)
          failed++
        } else {
          updated++
        }
      }
    } catch (error) {
      console.error(`[Rescore] Error processing lead ${lead.id}:`, error)
      failed++
    }
  }

  console.log(`[Rescore] Completed: ${updated} updated, ${failed} failed`)

  return NextResponse.json({
    success: true,
    message: `Rescored ${leads.length} leads, updated ${updated}`,
    stats: {
      total: leads.length,
      updated,
      failed,
    },
  })
}
