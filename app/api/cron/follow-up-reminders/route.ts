import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"
import { notifyFollowUpDue } from "@/lib/notifications/triggers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Cron job endpoint for sending follow-up reminders
 *
 * This endpoint should be called daily (or multiple times per day) to check for
 * leads with upcoming or overdue follow-ups and notify the assigned sales reps.
 *
 * Setup:
 * - Add to vercel.json cron configuration
 * - Or use an external cron service to call this endpoint
 * - Recommended: Run daily at 9:00 AM
 *
 * Security:
 * - This endpoint should be protected by a secret token in production
 * - Add CRON_SECRET to environment variables and verify in the request
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret in production
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
      const authHeader = req.headers.get("authorization")
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.error("[follow-up-cron] Unauthorized request")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    console.log("[follow-up-cron] Starting follow-up reminder check")

    // Get today's date at midnight for comparison
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    // Find all leads with follow_up_date today or in the past that haven't been completed
    const { data: dueLeads, error: leadsError } = await supabaseAdmin
      .from("sales_leads")
      .select("id, email, full_name, assigned_to, follow_up_date, status")
      .not("assigned_to", "is", null)
      .lte("follow_up_date", todayStr)
      .in("status", ["new", "contacted", "qualified"]) // Don't notify for converted or lost leads
      .order("follow_up_date", { ascending: true })

    if (leadsError) {
      console.error("[follow-up-cron] Error fetching due leads:", leadsError)
      return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
    }

    if (!dueLeads || dueLeads.length === 0) {
      console.log("[follow-up-cron] No follow-ups due today")
      return NextResponse.json({
        success: true,
        message: "No follow-ups due",
        count: 0
      })
    }

    console.log(`[follow-up-cron] Found ${dueLeads.length} leads with due follow-ups`)

    // Send notification for each due follow-up
    const results = await Promise.allSettled(
      dueLeads.map(async (lead) => {
        try {
          await notifyFollowUpDue({
            leadId: lead.id,
            leadEmail: lead.email,
            leadName: lead.full_name,
            salesRepId: lead.assigned_to!,
            dueDate: lead.follow_up_date,
          })
          console.log(`[follow-up-cron] Sent notification for lead ${lead.id} to rep ${lead.assigned_to}`)
          return { leadId: lead.id, success: true }
        } catch (error) {
          console.error(`[follow-up-cron] Failed to send notification for lead ${lead.id}:`, error)
          return { leadId: lead.id, success: false, error }
        }
      })
    )

    const successCount = results.filter(r => r.status === "fulfilled" && r.value.success).length
    const failureCount = results.length - successCount

    console.log(`[follow-up-cron] Completed: ${successCount} successful, ${failureCount} failed`)

    return NextResponse.json({
      success: true,
      message: `Processed ${dueLeads.length} follow-up reminders`,
      totalLeads: dueLeads.length,
      successCount,
      failureCount,
      results: results.map(r => r.status === "fulfilled" ? r.value : { success: false }),
    })
  } catch (error: any) {
    console.error("[follow-up-cron] Error:", error)
    return NextResponse.json(
      { error: error.message || "Follow-up reminder processing failed" },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to verify cron job is active
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Follow-up reminder cron endpoint is active",
    timestamp: new Date().toISOString(),
  })
}
