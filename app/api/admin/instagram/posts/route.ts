import { NextResponse } from "next/server"
import { fetchInstagramPosts } from "@/lib/instagram/client"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Fetch all recent posts (Instagram API max is 25 at a time)
    const posts = await fetchInstagramPosts(25)

    return NextResponse.json({
      success: true,
      posts,
      count: posts.length,
    })
  } catch (error) {
    console.error("Failed to fetch Instagram posts:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch Instagram posts",
        posts: [],
      },
      { status: 500 }
    )
  }
}
