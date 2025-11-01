import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Format email content
    const emailContent = `
New Contact Form Submission from NouriPet

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
Sent from NouriPet Contact Form
    `.trim()

    // Using Resend API (https://resend.com)
    // You'll need to add RESEND_API_KEY to your .env.local
    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured")
      // Still return success to user, but log the error
      return NextResponse.json({
        success: true,
        message: "Form submitted (email service not configured)"
      })
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "NouriPet Contact <noreply@nouripet.net>",
        to: ["dcohen@nouripet.net"],
        reply_to: email,
        subject: `Contact Form: ${subject}`,
        text: emailContent,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Resend API error:", errorData)
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Email sent successfully" })
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
