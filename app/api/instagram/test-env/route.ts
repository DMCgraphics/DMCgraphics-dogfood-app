import { NextResponse } from "next/server"
import { fetchInstagramPosts } from "@/lib/instagram/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Debug endpoint to test Instagram API configuration
 */
export async function GET() {
  try {
    const hasToken = !!process.env.INSTAGRAM_ACCESS_TOKEN
    const hasAccountId = !!process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
    const tokenPrefix = process.env.INSTAGRAM_ACCESS_TOKEN?.substring(0, 20) || 'not set'
    const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || 'not set'

    let posts = []
    let error = null

    try {
      posts = await fetchInstagramPosts(3)
    } catch (e: any) {
      error = e.message
    }

    return NextResponse.json({
      environment: process.env.NODE_ENV,
      hasToken,
      tokenPrefix,
      hasAccountId,
      accountId,
      postsCount: posts.length,
      error,
      samplePost: posts[0] || null,
    })
  } catch (err: any) {
    return NextResponse.json({
      error: err.message,
      stack: err.stack,
    }, { status: 500 })
  }
}
