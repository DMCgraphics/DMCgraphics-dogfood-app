import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Send email via Resend to support@nouripet.net
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "NouriPet Contact Form <hello@updates.nouripet.net>",
      to: ["support@nouripet.net"],
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Contact Form Submission</h2>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 8px 0;"><strong>Subject:</strong> ${subject}</p>
          </div>

          <div style="margin: 20px 0;">
            <strong>Message:</strong>
            <p style="white-space: pre-wrap; margin-top: 10px;">${message}</p>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Reply directly to this email to respond to ${name}.
          </p>
        </div>
      `,
      text: `New Contact Form Submission\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}\n\n---\nReply directly to this email to respond to ${name}.`,
      tags: [
        { name: "type", value: "contact_form" },
      ],
    })

    if (emailError) {
      console.error("Resend API error:", emailError)
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    console.log(`[contact] Email sent successfully: ${emailData?.id}`)

    // Save to Supabase database
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      const { error: dbError } = await supabase.from("contact_submissions").insert([
        {
          name: name.trim(),
          email: email.trim(),
          subject,
          message: message.trim(),
          status: "new",
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
