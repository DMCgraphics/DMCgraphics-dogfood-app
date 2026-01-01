import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"
import { Resend } from "resend"
import { generateNewsletterSummary } from "@/lib/instagram/newsletter-ai"
import { generateNewsletterHTML, generateNewsletterText } from "@/lib/email/newsletter-template"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * POST /api/instagram/newsletter/send-manual
 *
 * Manually send newsletter to specific email addresses
 * Workaround for relationship query issues
 */
export async function POST(req: NextRequest) {
  try {
    const cronSecret = req.headers.get("x-cron-secret")
    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { emails, monthOffset = 1 } = await req.json()

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json({ error: "emails array required" }, { status: 400 })
    }

    // Get target month
    const now = new Date()
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
    const newsletterMonth = `${targetMonth.getFullYear()}-${String(targetMonth.getMonth() + 1).padStart(2, "0")}`
    const monthName = targetMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })

    console.log(`[Newsletter Manual] Sending ${monthName} newsletter to ${emails.length} recipients`)

    // Get posts
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

    // Generate AI summary once
    const summaryResult = await generateNewsletterSummary({
      posts,
      monthName,
    })

    // Get user profiles
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .in("email", emails)

    if (profileError || !profiles) {
      return NextResponse.json({ error: "Failed to fetch user profiles" }, { status: 500 })
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as Array<{ email: string; error: string }>,
    }

    // Send to each recipient
    for (const profile of profiles) {
      try {
        const firstName = profile.full_name?.split(" ")[0] || "Friend"

        const html = generateNewsletterHTML({
          recipientName: firstName,
          monthName,
          aiSummary: summaryResult.summary,
          posts: posts.slice(0, 6),
          previewText: `Your ${monthName} NouriPet update is here!`,
        })

        const text = generateNewsletterText({
          recipientName: firstName,
          monthName,
          aiSummary: summaryResult.summary,
          posts: posts.slice(0, 6),
        })

        const { data: emailData, error: emailError } = await resend.emails.send({
          from: "NouriPet <hello@updates.nouripet.net>",
          to: [profile.email],
          subject: `Your ${monthName} NouriPet Update 🐾`,
          html,
          text,
          tags: [
            { name: "type", value: "newsletter" },
            { name: "month", value: newsletterMonth },
          ],
          headers: {
            "List-Unsubscribe": `<${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications>`,
          },
        })

        if (emailError) {
          throw new Error(emailError.message)
        }

        // Record send
        await supabaseAdmin.from("newsletter_sends").insert({
          user_id: profile.id,
          email: profile.email,
          newsletter_month: newsletterMonth,
          status: "sent",
          resend_email_id: emailData?.id,
          post_count: posts.length,
        })

        results.sent++
        console.log(`[Newsletter Manual] Sent to ${profile.email}`)
      } catch (error: any) {
        results.failed++
        results.errors.push({
          email: profile.email,
          error: error.message,
        })
        console.error(`[Newsletter Manual] Failed to send to ${profile.email}:`, error)

        // Record failure
        await supabaseAdmin.from("newsletter_sends").insert({
          user_id: profile.id,
          email: profile.email,
          newsletter_month: newsletterMonth,
          status: "failed",
          error_message: error.message,
          post_count: posts.length,
        })
      }

      // Rate limit between sends
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    return NextResponse.json({
      success: true,
      message: `Newsletter sent`,
      month: monthName,
      stats: {
        sent: results.sent,
        failed: results.failed,
        total: emails.length,
        aiCost: `$${summaryResult.estimatedCost.toFixed(4)}`,
        postCount: posts.length,
      },
      errors: results.errors.length > 0 ? results.errors : undefined,
    })
  } catch (error: any) {
    console.error("[Newsletter Manual] Fatal error:", error)
    return NextResponse.json({ error: error.message || "Send failed" }, { status: 500 })
  }
}
