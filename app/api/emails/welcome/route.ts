import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { generateSalesEmailHTML, generateSalesEmailText } from "@/lib/sales/email-template-html"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name } = body

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      )
    }

    const firstName = name.split(' ')[0]

    const bodyContent = `
      <h1>Welcome to Nouripet, ${firstName}! 🐾</h1>

      <p>Welcome to the Nouripet family! We're so glad you're here.</p>

      <p>Fresh, nutritious meals for your pup are just a few steps away. Here's what happens next:</p>

      <div class="highlight">
        <p style="margin: 8px 0;">✓ Tell us about your dog</p>
        <p style="margin: 8px 0;">✓ Choose your recipes</p>
        <p style="margin: 8px 0;">✓ Get a personalized meal plan</p>
        <p style="margin: 8px 0;">✓ Fresh food delivered every 2 weeks</p>
      </div>

      <p style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/plan-builder" class="cta">Complete Your Plan →</a>
      </p>

      <p>Have questions? We're here to help!</p>

      <p>Happy feeding,<br>
      The Nouripet Team</p>

      <p><em>P.S. All our recipes are nutritionist-approved and made with human-grade ingredients. Your pup is going to love this.</em></p>
    `

    const html = generateSalesEmailHTML({
      subject: `Welcome to Nouripet, ${firstName}!`,
      bodyContent,
    })

    const text = generateSalesEmailText({
      bodyContent,
    })

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Nouripet <hello@updates.nouripet.net>",
      to: [email],
      subject: `Welcome to Nouripet, ${firstName}! 🐾`,
      html,
      text,
      tags: [
        { name: "type", value: "welcome" },
      ],
    })

    if (emailError) {
      console.error("[welcome-email] Resend error:", emailError)
      return NextResponse.json(
        { error: emailError.message || "Failed to send email" },
        { status: 500 }
      )
    }

    console.log(`[welcome-email] Email sent successfully: ${emailData?.id} to ${email}`)

    return NextResponse.json({
      success: true,
      emailId: emailData?.id,
      message: "Welcome email sent successfully",
    })
  } catch (error: any) {
    console.error("[welcome-email] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    )
  }
}
