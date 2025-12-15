import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface TrackCostRequest {
  feature: string
  inputTokens: number
  outputTokens: number
  estimatedCost: number
  responseTimeMs?: number
  cached?: boolean
  llmUsed?: boolean
  sessionId?: string
  dogProfileHash?: string
  explanationType?: string
}

/**
 * POST /api/ai/track-cost
 *
 * Track AI token usage and costs in database
 */
export async function POST(request: NextRequest) {
  try {
    const body: TrackCostRequest = await request.json()

    const {
      feature,
      inputTokens,
      outputTokens,
      estimatedCost,
      responseTimeMs,
      cached = false,
      llmUsed = true,
      sessionId,
      dogProfileHash,
      explanationType,
    } = body

    // Validate required fields
    if (!feature || inputTokens === undefined || outputTokens === undefined || estimatedCost === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: feature, inputTokens, outputTokens, estimatedCost" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user (if authenticated)
    const { data: { user } } = await supabase.auth.getUser()

    // Insert token usage record
    const { error: insertError } = await supabase
      .from("ai_token_usage")
      .insert({
        feature,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        estimated_cost: estimatedCost,
        response_time_ms: responseTimeMs,
        cached,
        llm_used: llmUsed,
        session_id: sessionId,
        user_id: user?.id || null,
        dog_profile_hash: dogProfileHash,
        explanation_type: explanationType,
      })

    if (insertError) {
      console.error("[Track Cost] Database error:", insertError)
      return NextResponse.json(
        { error: "Failed to track cost" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Track Cost] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ai/track-cost?date=YYYY-MM-DD
 *
 * Get cost summary for specified day/month (defaults to today)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get date from query params or default to today
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const targetDate = dateParam || new Date().toISOString().split('T')[0]

    // Get costs for target date
    const { data: dayCosts } = await supabase
      .from("ai_daily_costs")
      .select("*")
      .eq("date", targetDate)
      .single()

    // Get current month's costs (based on target date's month)
    const targetDateObj = new Date(targetDate)
    const firstDayOfMonth = new Date(targetDateObj.getFullYear(), targetDateObj.getMonth(), 1)
    const lastDayOfMonth = new Date(targetDateObj.getFullYear(), targetDateObj.getMonth() + 1, 0)

    const { data: monthCosts } = await supabase
      .from("ai_daily_costs")
      .select("total_cost")
      .gte("date", firstDayOfMonth.toISOString().split('T')[0])
      .lte("date", lastDayOfMonth.toISOString().split('T')[0])

    const monthlyCost = monthCosts?.reduce((sum, day) => sum + parseFloat(day.total_cost || "0"), 0) || 0

    // Get all available dates for date picker
    const { data: allDates } = await supabase
      .from("ai_daily_costs")
      .select("date")
      .order("date", { ascending: false })
      .limit(90) // Last 90 days

    return NextResponse.json({
      daily: {
        cost: parseFloat(dayCosts?.total_cost || "0"),
        requests: dayCosts?.total_requests || 0,
        tokens: dayCosts?.total_tokens || 0,
        cacheHitRate: parseFloat(dayCosts?.cache_hit_rate || "0"),
      },
      monthly: {
        cost: monthlyCost,
      },
      availableDates: allDates?.map(d => d.date) || [],
      selectedDate: targetDate,
    })
  } catch (error) {
    console.error("[Track Cost] GET error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
