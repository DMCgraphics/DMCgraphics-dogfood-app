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
 * GET /api/ai/track-cost
 *
 * Get cost summary for current day/month
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Get today's costs
    const today = new Date().toISOString().split('T')[0]
    const { data: todayCosts } = await supabase
      .from("ai_daily_costs")
      .select("*")
      .eq("date", today)
      .single()

    // Get current month's costs
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    const { data: monthCosts } = await supabase
      .from("ai_daily_costs")
      .select("total_cost")
      .gte("date", firstDayOfMonth.toISOString().split('T')[0])

    const monthlyCost = monthCosts?.reduce((sum, day) => sum + parseFloat(day.total_cost || "0"), 0) || 0

    return NextResponse.json({
      daily: {
        cost: parseFloat(todayCosts?.total_cost || "0"),
        requests: todayCosts?.total_requests || 0,
        tokens: todayCosts?.total_tokens || 0,
        cacheHitRate: parseFloat(todayCosts?.cache_hit_rate || "0"),
      },
      monthly: {
        cost: monthlyCost,
      },
    })
  } catch (error) {
    console.error("[Track Cost] GET error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
