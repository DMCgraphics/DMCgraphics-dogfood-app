import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * Check newsletter send status
 * Shows recent newsletter sends and statistics
 */
export async function GET() {
  try {
    // Get recent newsletter sends
    const { data: recentSends, error: sendsError } = await supabaseAdmin
      .from("newsletter_sends")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (sendsError) {
      console.error("[Newsletter Status] Error:", sendsError)
    }

    // Get stats by month
    const { data: monthlyStats, error: statsError } = await supabaseAdmin
      .from("newsletter_sends")
      .select("newsletter_month, status")

    // Group by month and status
    const statsByMonth: Record<string, { sent: number; failed: number; total: number }> = {}

    monthlyStats?.forEach((send) => {
      if (!statsByMonth[send.newsletter_month]) {
        statsByMonth[send.newsletter_month] = { sent: 0, failed: 0, total: 0 }
      }
      statsByMonth[send.newsletter_month].total++
      if (send.status === "sent") {
        statsByMonth[send.newsletter_month].sent++
      } else {
        statsByMonth[send.newsletter_month].failed++
      }
    })

    // Check December 2024 posts
    const { data: decPosts, error: postsError } = await supabaseAdmin
      .from("instagram_posts")
      .select("count")
      .gte("timestamp", "2024-12-01")
      .lt("timestamp", "2025-01-01")

    // Check eligible subscribers
    const { data: subscribers, error: subError } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        email,
        marketing_opt_in,
        subscriptions!inner (
          status
        )
      `)
      .eq("marketing_opt_in", true)
      .in("subscriptions.status", ["active", "trialing", "past_due"])

    const uniqueSubscribers = new Set(subscribers?.map(s => s.id))

    return NextResponse.json({
      success: true,
      environment: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("wfjgcglyhnagnomdlgmd")
        ? "DEVELOPMENT"
        : "PRODUCTION",
      december2024: {
        posts: decPosts?.length || 0,
        eligibleSubscribers: uniqueSubscribers.size,
        newsletterSent: statsByMonth["2024-12"] || { sent: 0, failed: 0, total: 0 },
      },
      recentSends: recentSends?.slice(0, 10) || [],
      monthlyStats: statsByMonth,
      totalSends: recentSends?.length || 0,
    })
  } catch (error) {
    console.error("[Newsletter Status] Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to check status",
        success: false,
      },
      { status: 500 }
    )
  }
}
