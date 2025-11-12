import { NextResponse } from "next/server"
import { createServerSupabase, supabaseAdmin } from "@/lib/supabase/server"
import { Resend } from "resend"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    // Check if user is a delivery driver
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user has delivery_driver role
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("roles")
      .eq("id", user.id)
      .single()

    if (!profile?.roles || !profile.roles.includes('delivery_driver')) {
      return NextResponse.json(
        { error: "Unauthorized - Delivery driver access required" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { to, subject, message } = body

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: "Email, subject, and message are required" },
        { status: 400 }
      )
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: "NouriPet Delivery <no-reply@updates.nouripet.net>",
      to: [to],
      subject: subject,
      text: message,
    })

    if (error) {
      console.error("[delivery] Error sending email:", error)
      return NextResponse.json(
        { error: error.message || "Failed to send email" },
        { status: 500 }
      )
    }

    // Log the email send
    console.log(`[delivery] Email sent by ${user.email} to ${to}:`, {
      subject,
      email_id: data?.id
    })

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      id: data?.id
    })
  } catch (error: any) {
    console.error("[delivery] Error sending email:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    )
  }
}
