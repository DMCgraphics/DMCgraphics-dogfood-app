import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"
import { Resend } from "resend"
import { generateNewsletterSummary } from "@/lib/instagram/newsletter-ai"
import { generateNewsletterHTML, generateNewsletterText } from "@/lib/email/newsletter-template"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * POST /api/instagram/newsletter/preview
 *
 * Send preview newsletter to test email
 * Protected by cron secret
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authorization (admin only)
    const cronSecret = req.headers.get("x-cron-secret")
    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { testEmail, monthOffset = 1 } = body // monthOffset: 1 = last month, 2 = 2 months ago

    if (!testEmail) {
      return NextResponse.json({ error: "testEmail required" }, { status: 400 })
    }

    // Get posts from specified month
    const now = new Date()
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
    const newsletterMonth = `${targetMonth.getFullYear()}-${String(targetMonth.getMonth() + 1).padStart(2, "0")}`
    const monthName = targetMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })

    const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1)
    const monthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59)

    const { data: posts, error: postsError } = await supabaseAdmin
      .from("instagram_posts")
      .select("*")
      .gte("timestamp", monthStart.toISOString())
      .lte("timestamp", monthEnd.toISOString())
      .order("timestamp", { ascending: false })

    if (postsError || !posts || posts.length === 0) {
      return NextResponse.json({ error: `No posts found for ${monthName}` }, { status: 404 })
    }

    // Generate AI summary
    const summaryResult = await generateNewsletterSummary({
      posts,
      monthName,
    })

    // Generate email
    const html = generateNewsletterHTML({
      recipientName: "Preview User",
      monthName,
      aiSummary: summaryResult.summary,
      posts: posts.slice(0, 6),
      previewText: `[PREVIEW] Your ${monthName} NouriPet update`,
    })

    const text = generateNewsletterText({
      recipientName: "Preview User",
      monthName,
      aiSummary: summaryResult.summary,
      posts: posts.slice(0, 6),
    })

    // Send preview
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "NouriPet <hello@updates.nouripet.net>",
      to: [testEmail],
      subject: `[PREVIEW] Your ${monthName} NouriPet Update 🐾`,
      html,
      text,
      tags: [{ name: "type", value: "newsletter_preview" }],
    })

    if (emailError) {
      return NextResponse.json({ error: emailError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Preview sent",
      emailId: emailData?.id,
      stats: {
        month: monthName,
        postCount: posts.length,
        aiTokens: summaryResult.tokensUsed,
        aiCost: `$${summaryResult.estimatedCost.toFixed(4)}`,
      },
    })
  } catch (error: any) {
    console.error("[Newsletter Preview] Error:", error)
    return NextResponse.json({ error: error.message || "Preview failed" }, { status: 500 })
  }
}
