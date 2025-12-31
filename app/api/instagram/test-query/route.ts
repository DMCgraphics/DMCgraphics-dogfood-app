import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Direct database query test for Instagram posts
 */
export async function GET() {
  try {
    // Test 1: Simple count
    const { count: countResult, error: countError } = await supabaseAdmin
      .from("instagram_posts")
      .select("*", { count: "exact", head: true })

    // Test 2: Get actual posts
    const { data: posts, error: postsError, count } = await supabaseAdmin
      .from("instagram_posts")
      .select("*", { count: "exact" })
      .order("timestamp", { ascending: false })
      .limit(3)

    return NextResponse.json({
      test1_count: countResult,
      test1_error: countError?.message,
      test2_posts_length: posts?.length,
      test2_count: count,
      test2_error: postsError?.message,
      sample_post: posts?.[0] || null,
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    })
  } catch (err: any) {
    return NextResponse.json({
      error: err.message,
      stack: err.stack,
    }, { status: 500 })
  }
}
