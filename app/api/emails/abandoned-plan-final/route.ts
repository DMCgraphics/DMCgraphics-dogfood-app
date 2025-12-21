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
    const discountedPrice = price ? `$${((price * 0.85) / 100).toFixed(2)}` : "$29.75"
    const recipeList = recipes && recipes.length > 0
      ? recipes.map((r: string) => `• ${r}`).join('<br>')
      : '• Fresh, nutritious recipes'

    const planUrl = planId
      ? `${process.env.NEXT_PUBLIC_APP_URL}/plan-builder?plan_id=${planId}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/plan-builder`

    const bodyContent = `
      <h1>Last chance: 15% off ${dogName}'s first order! 🎁</h1>

      <p>Hi ${firstName},</p>

      <p>We really want ${dogName} to experience the Nouripet difference. So we're offering you <strong>15% off your first order</strong> when you complete your plan.</p>

      <div class="highlight" style="background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); border: none; padding: 24px; border-radius: 8px; text-align: center;">
        <p style="margin: 0; font-size: 24px; font-weight: bold; color: #2c3e50;">🎉 USE CODE: NOURI15 🎉</p>
        <p style="margin: 8px 0 0 0; font-size: 18px; color: #2c3e50;"><s>${priceFormatted}</s> → <strong>${discountedPrice}</strong> every 2 weeks</p>
      </div>

      <div class="highlight">
        <p style="margin: 8px 0;"><strong>Your plan for ${dogName}:</strong></p>
        <p style="margin: 8px 0;">🐕 <strong>${dogName}</strong>${dogWeight ? ` - ${dogWeight} lb` : ''}${dogBreed ? ` ${dogBreed}` : ''}</p>
        <p style="margin: 8px 0;"><strong>🥘 Recipes:</strong><br>${recipeList}</p>
      </div>

      <p style="text-align: center; margin: 32px 0;">
        <a href="${planUrl}" class="cta">Claim Your 15% Discount →</a>
      </p>

      <h2>Why dog parents choose Nouripet:</h2>
      <p style="margin: 8px 0;">✓ <strong>Fresh, human-grade ingredients</strong> - The same quality you'd eat</p>
      <p style="margin: 8px 0;">✓ <strong>Veterinarian & nutritionist approved</strong> - AAFCO balanced</p>
      <p style="margin: 8px 0;">✓ <strong>No fillers or by-products</strong> - Just real, wholesome food</p>
      <p style="margin: 8px 0;">✓ <strong>Convenient delivery</strong> - Right to your door every 2 weeks</p>

      <p><strong>This offer expires in 48 hours</strong>, so don't miss out on giving ${dogName} the nutrition they deserve.</p>

      <p>Have questions? Just reply to this email or call us anytime.</p>

      <p>Best,<br>
      The Nouripet Team</p>

      <p><em>P.S. Use code <strong>NOURI15</strong> at checkout to save 15% on your first order. Your pup will thank you!</em></p>
    `

    const html = generateSalesEmailHTML({
      subject: `Last chance: 15% off ${dogName}'s first order!`,
      bodyContent,
    })

    const text = generateSalesEmailText({
      bodyContent,
    })

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Nouripet <hello@updates.nouripet.net>",
      to: [email],
      subject: `Last chance: 15% off ${dogName}'s first order!`,
      html,
      text,
      tags: [
        { name: "type", value: "abandoned_plan_final" },
        { name: "plan_id", value: planId || "unknown" },
        { name: "sequence", value: "3" },
        { name: "discount_code", value: "NOURI15" },
      ],
    })

    if (emailError) {
      console.error("[abandoned-plan-final] Resend error:", emailError)
      return NextResponse.json(
        { error: emailError.message || "Failed to send email" },
        { status: 500 }
      )
    }

    console.log(`[abandoned-plan-final] Email sent successfully: ${emailData?.id} to ${email}`)

    return NextResponse.json({
      success: true,
      emailId: emailData?.id,
      message: "Abandoned plan final offer email sent successfully",
    })
  } catch (error: any) {
    console.error("[abandoned-plan-final] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    )
  }
}
