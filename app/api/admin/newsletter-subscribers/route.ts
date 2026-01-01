import { NextResponse } from "next/server"
import { getActiveNewsletterSubscribers } from "@/lib/newsletter/subscribers"

export const dynamic = "force-dynamic"

/**
 * Get list of newsletter-eligible subscribers
 * Admin endpoint to see who should receive newsletters
 */
export async function GET() {
  try {
    const subscribers = await getActiveNewsletterSubscribers()

    return NextResponse.json({
      success: true,
      count: subscribers.length,
      subscribers: subscribers.map((sub) => ({
        email: sub.email,
        name: sub.full_name,
        id: sub.id.slice(0, 8) + "...", // Partial ID for privacy
      })),
      criteria: {
        marketing_opt_in: true,
        subscription_status: ["active", "trialing", "past_due"],
      },
    })
  } catch (error) {
    console.error("[Newsletter Subscribers] Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch subscribers",
        success: false,
      },
      { status: 500 }
    )
  }
}
