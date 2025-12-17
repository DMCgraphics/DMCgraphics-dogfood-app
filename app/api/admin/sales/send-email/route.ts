import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Resend } from "resend"
import { processMergeFields } from "@/lib/sales/email-template-processor"
import { generateSalesEmailHTML, generateSalesEmailText } from "@/lib/sales/email-template-html"
import { checkEmailRateLimits } from "@/lib/sales/email-rate-limit"
import { validateEmail, validateSubject, validateEmailBody, sanitizeEmail } from "@/lib/sales/email-validator"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Role verification - must be admin, sales_manager, or sales_rep
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles, is_admin, full_name, email")
      .eq("id", user.id)
      .single()

    const isAuthorized =
      profile?.is_admin ||
      profile?.roles?.includes("sales_manager") ||
      profile?.roles?.includes("sales_rep")

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden - Requires admin or sales team role" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { leadId, templateId, subject, htmlBody, textBody, customVariables } = body

    if (!leadId || !subject || !htmlBody) {
      return NextResponse.json(
        { error: "Lead ID, subject, and HTML body are required" },
        { status: 400 }
      )
    }

    // Validate subject and body
    const subjectValidation = validateSubject(subject)
    if (!subjectValidation.valid) {
      return NextResponse.json(
        { error: subjectValidation.error },
        { status: 400 }
      )
    }

    const bodyValidation = validateEmailBody(htmlBody)
    if (!bodyValidation.valid) {
      return NextResponse.json(
        { error: bodyValidation.error },
        { status: 400 }
      )
    }

    // Check rate limits
    const rateLimitCheck = await checkEmailRateLimits(user.id, leadId)
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: rateLimitCheck.reason,
          resetAt: rateLimitCheck.resetAt,
          currentCount: rateLimitCheck.currentCount,
          limit: rateLimitCheck.limit,
        },
        { status: 429 }
      )
    }

    // Get lead details
    const { data: lead, error: leadError } = await supabase
      .from("sales_leads")
      .select("email, full_name, dog_name, dog_breed, dog_weight")
      .eq("id", leadId)
      .single()

    if (leadError || !lead) {
      console.error("Lead not found:", leadError)
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Validate lead email
    const emailValidation = validateEmail(lead.email)
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: `Invalid lead email: ${emailValidation.error}` },
        { status: 400 }
      )
    }

    // Build merge variables
    const variables = {
      lead_name: lead.full_name || lead.email.split('@')[0],
      lead_email: lead.email,
      dog_name: lead.dog_name || "your dog",
      dog_breed: lead.dog_breed || "",
      dog_weight: lead.dog_weight || "",
      rep_name: profile.full_name || profile.email.split('@')[0],
      rep_email: profile.email,
      company_name: "NouriPet",
      ...customVariables,
    }

    // Process templates with merge fields
    const finalSubject = processMergeFields(subject, variables)
    const processedHtmlBody = processMergeFields(htmlBody, variables)
    const processedTextBody = textBody ? processMergeFields(textBody, variables) : ''

    // Wrap in email template HTML
    const finalHtml = generateSalesEmailHTML({
      subject: finalSubject,
      bodyContent: processedHtmlBody,
    })

    const finalText = processedTextBody || generateSalesEmailText({
      bodyContent: processedHtmlBody,
    })

    // Send email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "NouriPet Sales <sales@updates.nouripet.net>",
      to: [lead.email],
      reply_to: profile.email,
      subject: finalSubject,
      html: finalHtml,
      text: finalText,
      tags: [
        { name: "type", value: "sales" },
        { name: "lead_id", value: leadId },
      ],
    })

    if (emailError) {
      console.error("[send-email] Resend error:", emailError)
      return NextResponse.json(
        { error: emailError.message || "Failed to send email" },
        { status: 500 }
      )
    }

    console.log(`[send-email] Email sent successfully: ${emailData?.id} to ${lead.email}`)

    // Create activity record
    const { data: activity, error: activityError } = await supabase
      .from("sales_activities")
      .insert({
        lead_id: leadId,
        activity_type: "email",
        subject: finalSubject,
        description: `Email sent to ${lead.email}`,
        performed_by: user.id,
        completed: true,
        completed_at: new Date().toISOString(),
        email_message_id: emailData?.id,
        email_to: lead.email,
        email_from: "sales@updates.nouripet.net",
        email_subject: finalSubject,
        email_html: finalHtml,
        email_text: finalText,
        email_status: "sent",
        email_template_id: templateId || null,
        email_metadata: {
          variables,
          sent_by: user.id,
          sent_by_name: profile.full_name || profile.email,
          sent_at: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (activityError) {
      console.error("[send-email] Activity creation error:", activityError)
      // Email was sent, but activity logging failed
      return NextResponse.json({
        success: true,
        emailId: emailData?.id,
        warning: "Email sent but activity logging failed",
      })
    }

    console.log(`[send-email] Activity created: ${activity.id}`)

    return NextResponse.json({
      success: true,
      emailId: emailData?.id,
      activityId: activity.id,
      message: "Email sent successfully",
    })
  } catch (error: any) {
    console.error("[send-email] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    )
  }
}
