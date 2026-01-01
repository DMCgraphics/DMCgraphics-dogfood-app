import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Vercel Cron Job: Send Monthly Instagram Newsletter
 * Runs on 1st of each month at midnight UTC
 *
 * Vercel automatically adds Authorization header with bearer token
 * This is verified by Vercel's infrastructure
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error("Cron: Unauthorized - auth header:", authHeader ? "present" : "missing")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Cron: Starting Instagram newsletter send...")

    // Call the worker endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nouripet.net"
    const response = await fetch(`${baseUrl}/api/instagram/newsletter/send`, {
      method: "POST",
      headers: {
        "x-cron-secret": process.env.CRON_SECRET!,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Cron: Newsletter send failed:", data)
      return NextResponse.json({ error: "Newsletter send failed", details: data }, { status: 500 })
    }

    console.log("Cron: Newsletter send completed:", data)

    return NextResponse.json({
      success: true,
      message: "Instagram newsletter sent",
      result: data,
    })
  } catch (error: any) {
    console.error("Cron: Error in newsletter send:", error)
    return NextResponse.json({ error: error.message || "Cron job failed" }, { status: 500 })
  }
}
