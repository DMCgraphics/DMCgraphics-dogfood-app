import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Vercel Cron Job: Refresh Instagram Posts
 * Runs every 12 hours to sync latest Instagram posts
 *
 * Vercel automatically adds Authorization header with bearer token
 * This is verified by Vercel's infrastructure
 */
export async function GET(req: NextRequest) {
  try {
    // Verify this is a Vercel cron request
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Cron: Starting Instagram posts refresh...")

    // Call the refresh endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nouripet.net"
    const response = await fetch(`${baseUrl}/api/instagram/refresh`, {
      method: "POST",
      headers: {
        "x-cron-secret": process.env.CRON_SECRET || "default-secret",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Cron: Instagram refresh failed:", data)
      return NextResponse.json(
        { error: "Refresh failed", details: data },
        { status: 500 }
      )
    }

    console.log("Cron: Instagram refresh completed:", data)

    return NextResponse.json({
      success: true,
      message: "Instagram posts refreshed",
      result: data,
    })
  } catch (error: any) {
    console.error("Cron: Error in Instagram refresh:", error)
    return NextResponse.json(
      { error: error.message || "Cron job failed" },
      { status: 500 }
    )
  }
}
