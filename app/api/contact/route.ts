import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import {
  checkContactRateLimits,
  extractIpAddress,
  hashIp,
} from "@/lib/contact-rate-limit"
import { validateContactContent, sanitizeInput } from "@/lib/spam-detection"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message, honeypot, submissionTimeSeconds } = body

    // 1. Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // 2. Honeypot check (server-side verification)
    if (honeypot) {
      console.log("[spam] Honeypot triggered:", { email })
      return NextResponse.json({ error: "Invalid submission" }, { status: 400 })
    }

    // 3. Timing check (server-side verification)
    if (submissionTimeSeconds && submissionTimeSeconds < 3) {
      console.log("[spam] Too fast submission:", {
        email,
        time: submissionTimeSeconds,
      })
      return NextResponse.json({ error: "Please slow down" }, { status: 429 })
    }

    // 4. Content validation
    const contentCheck = validateContactContent({
      name: sanitizeInput(name),
      email: sanitizeInput(email),
      message: sanitizeInput(message),
    })

    if (!contentCheck.valid) {
      console.log("[spam] Content validation failed:", {
        email,
        reason: contentCheck.reason,
      })
      return NextResponse.json({ error: contentCheck.reason }, { status: 400 })
    }

    // 5. Rate limiting
    const rateLimitCheck = await checkContactRateLimits(request, email)
    if (!rateLimitCheck.allowed) {
      console.log("[spam] Rate limit exceeded:", {
        email,
        reason: rateLimitCheck.reason,
      })
      return NextResponse.json({ error: rateLimitCheck.reason }, { status: 429 })
    }

    // 6. Extract metadata for tracking
    const ipAddress = extractIpAddress(request)
    const ipHash = ipAddress ? hashIp(ipAddress) : null
    const userAgent = request.headers.get("user-agent") || null
    const referer = request.headers.get("referer") || null

    const metadata = {
      referer,
      submitted_at: new Date().toISOString(),
      client_timing: submissionTimeSeconds || null,
    }

    // 7. Sanitize inputs
    const sanitizedName = sanitizeInput(name)
    const sanitizedEmail = sanitizeInput(email)
    const sanitizedMessage = sanitizeInput(message)

    // 8. Send email via Resend to support@nouripet.net
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "NouriPet Contact Form <hello@updates.nouripet.net>",
      to: ["support@nouripet.net"],
      replyTo: sanitizedEmail,
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Contact Form Submission</h2>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Name:</strong> ${sanitizedName}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${sanitizedEmail}</p>
            <p style="margin: 8px 0;"><strong>Subject:</strong> ${subject}</p>
          </div>

          <div style="margin: 20px 0;">
            <strong>Message:</strong>
            <p style="white-space: pre-wrap; margin-top: 10px;">${sanitizedMessage}</p>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Reply directly to this email to respond to ${sanitizedName}.
          </p>
        </div>
      `,
      text: `New Contact Form Submission\n\nName: ${sanitizedName}\nEmail: ${sanitizedEmail}\nSubject: ${subject}\n\nMessage:\n${sanitizedMessage}\n\n---\nReply directly to this email to respond to ${sanitizedName}.`,
      tags: [
        { name: "type", value: "contact_form" },
      ],
    })

    if (emailError) {
      console.error("Resend API error:", emailError)
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    console.log(`[contact] Email sent successfully: ${emailData?.id}`)

    // 9. Save to Supabase database with tracking fields
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      const { error: dbError } = await supabase.from("contact_submissions").insert([
        {
          name: sanitizedName,
          email: sanitizedEmail,
          subject,
          message: sanitizedMessage,
          status: "new",
          ip_hash: ipHash,
          user_agent: userAgent,
          submission_time_seconds: submissionTimeSeconds || null,
          metadata,
        },
      ])

      if (dbError) {
        console.error("Supabase insert error:", dbError)
        // Don't fail the request if DB insert fails - we already sent the email
      }
    } catch (dbError) {
      console.error("Database error:", dbError)
      // Continue - email was sent successfully
    }

    return NextResponse.json({ success: true, message: "Email sent successfully" })
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
