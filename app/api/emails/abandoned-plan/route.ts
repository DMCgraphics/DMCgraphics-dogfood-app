import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { generateSalesEmailHTML, generateSalesEmailText } from "@/lib/sales/email-template-html"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name, dogName, dogWeight, dogBreed, recipes, price, planId } = body

    if (!email || !name || !dogName) {
      return NextResponse.json(
        { error: "Email, name, and dog name are required" },
        { status: 400 }
      )
    }

    const firstName = name.split(' ')[0]
    const priceFormatted = price ? `$${(price / 100).toFixed(2)}` : "$35"
    const recipeList = recipes && recipes.length > 0
      ? recipes.map((r: string) => `• ${r}`).join('<br>')
      : '• Fresh, nutritious recipes'

    const planUrl = planId
      ? `${process.env.NEXT_PUBLIC_APP_URL}/plan-builder?plan_id=${planId}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/plan-builder`

    const bodyContent = `
      <h1>We saved ${dogName}'s meal plan for you</h1>

      <p>Hi ${firstName},</p>

      <p>We noticed you started creating a meal plan for ${dogName} but didn't finish checkout. No worries – we saved everything for you!</p>

      <div class="highlight">
        <p style="margin: 8px 0;"><strong>Here's what you selected:</strong></p>
        <p style="margin: 8px 0;">🐕 <strong>${dogName}</strong>${dogWeight ? ` - ${dogWeight} lb` : ''}${dogBreed ? ` ${dogBreed}` : ''}</p>
        <p style="margin: 8px 0;"><strong>🥘 Recipes:</strong><br>${recipeList}</p>
        <p style="margin: 8px 0;">💰 <strong>${priceFormatted} every 2 weeks</strong></p>
      </div>

      <p style="text-align: center;">
        <a href="${planUrl}" class="cta">Complete ${dogName}'s Plan →</a>
      </p>

      <h2>Still deciding? Here's what makes Nouripet special:</h2>
      <p style="margin: 8px 0;">✓ Fresh, human-grade ingredients</p>
      <p style="margin: 8px 0;">✓ Nutritionist-formulated recipes</p>
      <p style="margin: 8px 0;">✓ No artificial preservatives</p>
      <p style="margin: 8px 0;">✓ Convenient local delivery</p>

      <p>Questions or concerns? Just reply to this email – we'd love to help.</p>

      <p>Best,<br>
      The Nouripet Team</p>

      <p><em>P.S. ${dogName} deserves the best. Let's make mealtime something special.</em></p>
    `

    const html = generateSalesEmailHTML({
      subject: `We saved ${dogName}'s meal plan for you`,
      bodyContent,
    })

    const text = generateSalesEmailText({
      bodyContent,
    })

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Nouripet <hello@updates.nouripet.net>",
      to: [email],
      subject: `We saved ${dogName}'s meal plan for you`,
      html,
      text,
      tags: [
        { name: "type", value: "abandoned_plan" },
        { name: "plan_id", value: planId || "unknown" },
      ],
    })

    if (emailError) {
      console.error("[abandoned-plan-email] Resend error:", emailError)
      return NextResponse.json(
        { error: emailError.message || "Failed to send email" },
        { status: 500 }
      )
    }

    console.log(`[abandoned-plan-email] Email sent successfully: ${emailData?.id} to ${email}`)

    return NextResponse.json({
      success: true,
      emailId: emailData?.id,
      message: "Abandoned plan email sent successfully",
    })
  } catch (error: any) {
    console.error("[abandoned-plan-email] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    )
  }
}
