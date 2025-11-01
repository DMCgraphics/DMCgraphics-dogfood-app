import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Submit to Formspree
    const response = await fetch("https://formspree.io/f/xnnoolqd", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        subject,
        message,
        _replyto: email,
      }),
    })

    if (!response.ok) {
      console.error("Formspree API error:", response.status)
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

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
