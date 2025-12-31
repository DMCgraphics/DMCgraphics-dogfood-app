import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"
import { Resend } from "resend"
import { getActiveNewsletterSubscribers, hasReceivedNewsletter } from "@/lib/newsletter/subscribers"
import { generateNewsletterSummary } from "@/lib/instagram/newsletter-ai"
import { generateNewsletterHTML, generateNewsletterText } from "@/lib/email/newsletter-template"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 minutes for batch sending

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * POST /api/instagram/newsletter/send
 *
 * Generates and sends monthly newsletter to all eligible subscribers
 * Protected by cron secret
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authorization
    const cronSecret = req.headers.get("x-cron-secret")
    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[Newsletter] Starting monthly newsletter send...")

    // Determine which month to send for (previous month)
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const newsletterMonth = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`
    const monthName = lastMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })

    console.log(`[Newsletter] Generating for: ${monthName} (${newsletterMonth})`)

    // Get Instagram posts from previous month
    const monthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)
    const monthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59)

    const { data: posts, error: postsError } = await supabaseAdmin
      .from("instagram_posts")
      .select("*")
      .gte("timestamp", monthStart.toISOString())
      .lte("timestamp", monthEnd.toISOString())
      .order("timestamp", { ascending: false })

    if (postsError) {
      console.error("[Newsletter] Error fetching posts:", postsError)
      return NextResponse.json({ error: "Failed to fetch Instagram posts" }, { status: 500 })
    }

    if (!posts || posts.length === 0) {
      console.log("[Newsletter] No posts found for month, skipping send")
      return NextResponse.json({
        success: true,
        message: "No posts to send newsletter for",
        month: monthName,
      })
    }

    console.log(`[Newsletter] Found ${posts.length} posts for ${monthName}`)

    // Generate AI summary (single call for all emails)
    const summaryResult = await generateNewsletterSummary({
      posts,
      monthName,
    })

    if (summaryResult.error) {
      console.warn("[Newsletter] AI generation had error, using fallback:", summaryResult.error)
    }

    console.log(
      `[Newsletter] AI summary generated (${summaryResult.tokensUsed} tokens, $${summaryResult.estimatedCost.toFixed(4)})`
    )

    // Get eligible subscribers
    const subscribers = await getActiveNewsletterSubscribers()

    if (subscribers.length === 0) {
      console.log("[Newsletter] No eligible subscribers found")
      return NextResponse.json({
        success: true,
        message: "No eligible subscribers",
        month: monthName,
      })
    }

    console.log(`[Newsletter] Sending to ${subscribers.length} subscribers`)

    // Filter out users who already received this month's newsletter
    const subscribersToSend = []
    for (const subscriber of subscribers) {
      const alreadyReceived = await hasReceivedNewsletter(subscriber.id, newsletterMonth)
      if (!alreadyReceived) {
        subscribersToSend.push(subscriber)
      }
    }

    console.log(
      `[Newsletter] ${subscribersToSend.length} new recipients (${subscribers.length - subscribersToSend.length} already sent)`
    )

    // Send emails in batches (Resend has rate limits)
    const BATCH_SIZE = 100
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as Array<{ email: string; error: string }>,
    }

    for (let i = 0; i < subscribersToSend.length; i += BATCH_SIZE) {
      const batch = subscribersToSend.slice(i, i + BATCH_SIZE)

      console.log(`[Newsletter] Sending batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} emails)`)

      const batchResults = await Promise.allSettled(
        batch.map(async (subscriber) => {
          try {
            // Generate personalized email
            const firstName = subscriber.full_name?.split(" ")[0] || "Friend"

            const html = generateNewsletterHTML({
              recipientName: firstName,
              monthName,
              aiSummary: summaryResult.summary,
              posts: posts.slice(0, 6), // Top 6 posts
              previewText: `Your ${monthName} NouriPet update is here!`,
            })

            const text = generateNewsletterText({
              recipientName: firstName,
              monthName,
              aiSummary: summaryResult.summary,
              posts: posts.slice(0, 6),
            })

            // Send via Resend
            const { data: emailData, error: emailError } = await resend.emails.send({
              from: "NouriPet <hello@updates.nouripet.net>",
              to: [subscriber.email],
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

            // Record successful send
            await supabaseAdmin.from("newsletter_sends").insert({
              user_id: subscriber.id,
              email: subscriber.email,
              newsletter_month: newsletterMonth,
              status: "sent",
              resend_email_id: emailData?.id,
              post_count: posts.length,
            })

            return { email: subscriber.email, success: true, emailId: emailData?.id }
          } catch (error: any) {
            // Record failed send
            await supabaseAdmin.from("newsletter_sends").insert({
              user_id: subscriber.id,
              email: subscriber.email,
              newsletter_month: newsletterMonth,
              status: "failed",
              error_message: error.message,
              post_count: posts.length,
            })

            throw error
          }
        })
      )

      // Tally results
      batchResults.forEach((result, idx) => {
        if (result.status === "fulfilled") {
          results.sent++
        } else {
          results.failed++
          results.errors.push({
            email: batch[idx].email,
            error: result.reason?.message || "Unknown error",
          })
        }
      })

      // Rate limit: Wait 1 second between batches
      if (i + BATCH_SIZE < subscribersToSend.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    console.log(`[Newsletter] Send complete: ${results.sent} sent, ${results.failed} failed`)

    // Send admin alert if high failure rate
    const failureRate = results.failed / (results.sent + results.failed)
    if (failureRate > 0.1 && results.failed > 5) {
      await sendAdminAlert({
        month: monthName,
        sent: results.sent,
        failed: results.failed,
        errors: results.errors.slice(0, 10), // First 10 errors
      })
    }

    return NextResponse.json({
      success: true,
      message: `Newsletter sent successfully`,
      month: monthName,
      stats: {
        totalSubscribers: subscribers.length,
        sent: results.sent,
        failed: results.failed,
        failureRate: (failureRate * 100).toFixed(1) + "%",
        aiCost: `$${summaryResult.estimatedCost.toFixed(4)}`,
        postCount: posts.length,
      },
      errors: results.errors.length > 0 ? results.errors.slice(0, 5) : undefined,
    })
  } catch (error: any) {
    console.error("[Newsletter] Fatal error:", error)
    return NextResponse.json({ error: error.message || "Newsletter send failed" }, { status: 500 })
  }
}

/**
 * Send alert to admins about high failure rate
 */
async function sendAdminAlert(stats: {
  month: string
  sent: number
  failed: number
  errors: Array<{ email: string; error: string }>
}) {
  try {
    const html = `
      <h2>🚨 Newsletter Send Alert</h2>
      <p>High failure rate detected for ${stats.month} newsletter:</p>
      <ul>
        <li>Sent: ${stats.sent}</li>
        <li>Failed: ${stats.failed}</li>
        <li>Failure Rate: ${((stats.failed / (stats.sent + stats.failed)) * 100).toFixed(1)}%</li>
      </ul>
      <h3>Sample Errors:</h3>
      <ul>
        ${stats.errors.map((e) => `<li>${e.email}: ${e.error}</li>`).join("\n")}
      </ul>
    `

    await resend.emails.send({
      from: "NouriPet Alerts <no-reply@updates.nouripet.net>",
      to: ["dcohen@nouripet.net", "bbalick@nouripet.net"],
      subject: `⚠️ Newsletter Send Issues - ${stats.month}`,
      html,
    })
  } catch (error) {
    console.error("[Newsletter] Failed to send admin alert:", error)
  }
}
