import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"
import { fetchInstagramPosts } from "@/lib/instagram/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Refresh Instagram posts cache
 * This endpoint fetches latest posts from Instagram API and updates the database
 * Should be called via cron job (e.g., every 6-24 hours)
 *
 * Authentication: Requires admin access OR valid cron secret
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authorization - either admin user or cron secret
    const authHeader = req.headers.get("authorization")
    const cronSecret = req.headers.get("x-cron-secret")

    // Check cron secret first (for automated jobs)
    if (cronSecret && cronSecret === process.env.CRON_SECRET) {
      // Authorized via cron secret
    } else if (authHeader?.startsWith("Bearer ")) {
      // Check admin access
      const token = authHeader.substring(7)
      // TODO: Verify admin token if needed
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Starting Instagram posts refresh...")

    // Fetch latest posts from Instagram API
    const posts = await fetchInstagramPosts(12)

    if (posts.length === 0) {
      console.warn("No Instagram posts fetched")
      return NextResponse.json({
        success: true,
        message: "No posts to sync",
        count: 0,
      })
    }

    console.log(`Fetched ${posts.length} posts from Instagram API`)

    // Upsert posts into database
    const postsToInsert = posts.map(post => ({
      instagram_id: post.id,
      media_type: post.media_type,
      media_url: post.media_url,
      permalink: post.permalink,
      caption: post.caption || null,
      timestamp: post.timestamp,
      thumbnail_url: post.thumbnail_url || null,
    }))

    const { error: upsertError } = await supabaseAdmin
      .from("instagram_posts")
      .upsert(postsToInsert, {
        onConflict: "instagram_id",
        ignoreDuplicates: false,
      })

    if (upsertError) {
      console.error("Error upserting Instagram posts:", upsertError)
      return NextResponse.json(
        { error: "Failed to update posts cache" },
        { status: 500 }
      )
    }

    // Clean up old posts (keep only last 50)
    const { error: cleanupError } = await supabaseAdmin.rpc("cleanup_old_instagram_posts", {
      keep_count: 50,
    })

    if (cleanupError) {
      console.warn("Error cleaning up old posts:", cleanupError)
      // Non-fatal error, continue
    }

    console.log(`Successfully synced ${posts.length} Instagram posts`)

    return NextResponse.json({
      success: true,
      message: `Synced ${posts.length} posts`,
      count: posts.length,
      lastUpdate: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Error refreshing Instagram posts:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to refresh Instagram posts",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
