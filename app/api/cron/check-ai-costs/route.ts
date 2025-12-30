import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkCostBudget, sendCostAlerts } from "@/lib/ai/cost-monitor"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/cron/check-ai-costs
 *
 * Cron job to check AI costs and send alerts if needed
 * Should be called every hour via Vercel Cron or similar
 *
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-ai-costs",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Get today's costs
    const today = new Date().toISOString().split('T')[0]
    const { data: todayCosts } = await supabase
      .from("ai_daily_costs")
      .select("*")
      .eq("date", today)
      .single()

    const dailyCost = parseFloat(todayCosts?.total_cost || "0")

    // Get current month's costs
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    const { data: monthCosts } = await supabase
      .from("ai_daily_costs")
      .select("total_cost")
      .gte("date", firstDayOfMonth.toISOString().split('T')[0])

    const monthlyCost = monthCosts?.reduce(
      (sum, day) => sum + parseFloat(day.total_cost || "0"),
      0
    ) || 0

    // Check if costs exceed budget
    const alerts = await checkCostBudget(dailyCost, monthlyCost)

    if (alerts.length > 0) {
      console.log(`[Cron] Found ${alerts.length} cost alerts`)

      // Send email alerts
      await sendCostAlerts(alerts)

      // Log alerts to database
      for (const alert of alerts) {
        await supabase.from("ai_cost_alerts").insert({
          alert_type: alert.type,
          period: alert.period,
          current_cost: alert.currentCost,
          budget_limit: alert.limit,
          percentage: alert.percentage,
          message: alert.message,
          recipients: [
            process.env.AI_ALERT_EMAIL_1 || "bbalick@nouripet.net",
            process.env.AI_ALERT_EMAIL_2 || "dcohen@nouripet.net",
          ],
          email_sent: true,
        })

        // Update daily costs table to mark alert as sent
        if (alert.period === "daily") {
          await supabase
            .from("ai_daily_costs")
            .update({
              alert_sent: true,
              alert_type: alert.type,
            })
            .eq("date", today)
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      dailyCost,
      monthlyCost,
      alertsFound: alerts.length,
      alerts: alerts.map((a) => ({
        type: a.type,
        period: a.period,
        percentage: a.percentage,
      })),
    })
  } catch (error) {
    console.error("[Cron] Check AI costs error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
