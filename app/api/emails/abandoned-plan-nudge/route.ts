import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { generateSalesEmailHTML, generateSalesEmailText } from "@/lib/sales/email-template-html"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name, dogName } = body

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      )
    }

    const firstName = name.split(' ')[0]
    const dogNameText = dogName || "your dog"

    const bodyContent = `
      <h1>Still there, ${firstName}? 👋</h1>

      <p>We noticed you started creating a meal plan for ${dogNameText} but got interrupted.</p>

      <p>No worries! We saved everything for you and you can pick up right where you left off.</p>

      <p style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/plan-builder" class="cta">Continue Building Your Plan →</a>
      </p>

      <p>Fresh, nutritious meals for ${dogNameText} are just a few clicks away.</p>

      <p>Best,<br>
      The Nouripet Team</p>
    `

    const html = generateSalesEmailHTML({
      subject: `Still there? We saved your plan for ${dogNameText}`,
      bodyContent,
    })

    const text = generateSalesEmailText({
      bodyContent,
    })

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Nouripet <hello@updates.nouripet.net>",
      to: [email],
      subject: `Still there? We saved your plan for ${dogNameText}`,
      html,
      text,
      tags: [
        { name: "type", value: "abandoned_plan_nudge" },
        { name: "sequence", value: "1" },
      ],
    })

    if (emailError) {
      console.error("[abandoned-plan-nudge] Resend error:", emailError)
      return NextResponse.json(
        { error: emailError.message || "Failed to send email" },
        { status: 500 }
      )
    }

    console.log(`[abandoned-plan-nudge] Email sent successfully: ${emailData?.id} to ${email}`)

    return NextResponse.json({
      success: true,
      emailId: emailData?.id,
      message: "Abandoned plan nudge email sent successfully",
    })
  } catch (error: any) {
    console.error("[abandoned-plan-nudge] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    )
  }
}
