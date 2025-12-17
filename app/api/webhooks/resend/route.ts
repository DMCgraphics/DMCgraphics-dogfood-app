import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Resend webhook endpoint for tracking email events
 * Handles: email.sent, email.delivered, email.opened, email.clicked, email.bounced
 *
 * Note: Resend uses Svix for webhook signatures. For now, we'll log and process all events.
 * TODO: Add signature verification in production using RESEND_WEBHOOK_SECRET
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const event = JSON.parse(rawBody)

    const emailId = event.data?.email_id
    const eventType = event.type

    console.log(`[resend webhook] Received ${eventType} for email ${emailId}`)

    if (!emailId) {
      console.error("[resend webhook] Missing email_id in webhook payload")
      return NextResponse.json({ error: "Missing email_id" }, { status: 400 })
    }

    // Store raw event for audit trail
    const { error: eventInsertError } = await supabaseAdmin
      .from("sales_email_events")
      .insert({
        email_message_id: emailId,
        event_type: eventType,
        payload: event,
        processed: false,
      })

    if (eventInsertError) {
      console.error("[resend webhook] Failed to store event:", eventInsertError)
    }

    // Find the corresponding activity
    const { data: activity } = await supabaseAdmin
      .from("sales_activities")
      .select("id, email_open_count, email_click_count")
      .eq("email_message_id", emailId)
      .eq("activity_type", "email")
      .single()

    if (!activity) {
      console.log(`[resend webhook] No activity found for email ${emailId}`)
      return NextResponse.json({ received: true })
    }

    // Update activity based on event type
    const updates: any = {}

    switch (eventType) {
      case "email.delivered":
        updates.email_status = "delivered"
        updates.email_delivered_at = new Date().toISOString()
        break

      case "email.opened":
        updates.email_status = "opened"
        if (!activity.email_open_count || activity.email_open_count === 0) {
          updates.email_opened_at = new Date().toISOString()
        }
        updates.email_open_count = (activity.email_open_count || 0) + 1
        break

      case "email.clicked":
        updates.email_status = "clicked"
        if (!activity.email_click_count || activity.email_click_count === 0) {
          updates.email_clicked_at = new Date().toISOString()
        }
        updates.email_click_count = (activity.email_click_count || 0) + 1
        break

      case "email.bounced":
        updates.email_status = "bounced"
        updates.email_bounced_at = new Date().toISOString()
        break

      case "email.complained":
        updates.email_status = "spam"
        break

      default:
        console.log(`[resend webhook] Unhandled event type: ${eventType}`)
    }

    // Update activity if we have updates
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("sales_activities")
        .update(updates)
        .eq("id", activity.id)

      if (updateError) {
        console.error("[resend webhook] Failed to update activity:", updateError)
      } else {
        console.log(`[resend webhook] Activity ${activity.id} updated:`, updates)

        // Mark event as processed
        await supabaseAdmin
          .from("sales_email_events")
          .update({ processed: true })
          .eq("email_message_id", emailId)
          .eq("event_type", eventType)
          .eq("processed", false)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("[resend webhook] Error:", error)
    return NextResponse.json(
      { error: error.message || "Webhook processing failed" },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to verify webhook is active
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Resend webhook endpoint is active",
    timestamp: new Date().toISOString(),
  })
}
