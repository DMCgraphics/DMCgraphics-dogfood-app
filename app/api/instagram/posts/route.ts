import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Get cached Instagram posts
 * Public endpoint - returns cached posts from database
 * Updated: 2025-12-31
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "12", 10)

    // Query Instagram posts from database
    const { data: posts, error } = await supabaseAdmin
      .from("instagram_posts")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(Math.min(limit, 50))

    if (error) {
      console.error("[Instagram Posts API] Error:", error)
      return NextResponse.json(
        { error: "Failed to fetch Instagram posts", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        posts: posts || [],
        count: posts?.length || 0,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    )
  } catch (error: any) {
    console.error("[Instagram Posts API] Exception:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
