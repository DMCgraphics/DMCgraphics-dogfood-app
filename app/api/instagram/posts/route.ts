import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Get cached Instagram posts
 * Public endpoint - returns cached posts from database
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "12", 10)

    const { data: posts, error } = await supabaseAdmin
      .from("instagram_posts")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(Math.min(limit, 50)) // Cap at 50 posts

    if (error) {
      console.error("Error fetching Instagram posts:", error)
      return NextResponse.json(
        { error: "Failed to fetch Instagram posts" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      posts: posts || [],
      count: posts?.length || 0,
    })
  } catch (error: any) {
    console.error("Error in GET /api/instagram/posts:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
