import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createServerSupabase } from "@/lib/supabase/server"
import { generateSalesEmailHTML, generateSalesEmailText } from "@/lib/sales/email-template-html"
import * as fs from "fs"
import * as path from "path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    // Load static PDF guide
    console.log("[nutrition-guide] Loading PDF guide...")
    let pdfBase64: string
    try {
      const pdfPath = path.join(process.cwd(), "public", "nutrition-guide.pdf")
      const pdfBuffer = fs.readFileSync(pdfPath)
      pdfBase64 = pdfBuffer.toString("base64")
    } catch (pdfError) {
      console.error("[nutrition-guide] PDF loading error:", pdfError)
      return NextResponse.json({ error: "Failed to load PDF guide" }, { status: 500 })
    }

    // Store lead in database
    const supabase = createServerSupabase()
    try {
      const { error: dbError } = await supabase.from("sales_leads").insert({
        email,
        source: "exit_intent_popup",
        source_metadata: {
          guide_sent: true,
          discount_code: "NOURI15",
          sent_at: new Date().toISOString(),
        },
        status: "new",
        priority: "warm",
        tags: ["exit_intent", "nutrition_guide", "NOURI15"],
      })

      if (dbError) {
        console.warn("[nutrition-guide] Database insert warning:", dbError.message)
        // Don't fail the request if database insert fails, still send email
      }
    } catch (dbError) {
      console.warn("[nutrition-guide] Database error (continuing anyway):", dbError)
    }

    // Email body content
    const bodyContent = `
      <h1>Your Free Dog Nutrition Guide is Here! 🐾</h1>

      <p>Thank you for your interest in better nutrition for your pup! We've attached your comprehensive Dog Nutrition Guide—it's packed with science-backed tips to help your dog thrive.</p>

      <div class="highlight">
        <p style="margin: 8px 0;"><strong>Inside your guide:</strong></p>
        <p style="margin: 8px 0;">✓ How to calculate your dog's daily calorie needs</p>
        <p style="margin: 8px 0;">✓ Understanding AAFCO standards</p>
        <p style="margin: 8px 0;">✓ Fresh food vs. kibble comparison</p>
        <p style="margin: 8px 0;">✓ Reading ingredient labels like a pro</p>
        <p style="margin: 8px 0;">✓ Portion sizing by weight & activity</p>
        <p style="margin: 8px 0;">✓ Common nutrition mistakes to avoid</p>
      </div>

      <p style="margin: 24px 0; font-size: 18px; font-weight: 600; color: #0f172a;">
        🎁 Plus, here's your exclusive discount:
      </p>

      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
        <p style="color: white; font-size: 16px; margin: 0 0 8px 0;">Use code</p>
        <p style="color: white; font-size: 28px; font-weight: bold; margin: 0; letter-spacing: 2px;">NOURI15</p>
        <p style="color: white; font-size: 16px; margin: 8px 0 0 0;">for 15% off your first month</p>
      </div>

      <p style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/plan-builder" class="cta">Build Your Dog's Plan →</a>
      </p>

      <p>Ready to give your dog fresh, personalized nutrition? Our plan builder takes just 2 minutes, and we'll calculate exactly what your dog needs based on their unique profile.</p>

      <p><strong>Why NouriPet?</strong></p>
      <div class="highlight">
        <p style="margin: 8px 0;">🥩 Fresh, human-grade ingredients</p>
        <p style="margin: 8px 0;">🔬 Vet nutritionist formulated & AAFCO certified</p>
        <p style="margin: 8px 0;">📊 Complete nutrition transparency</p>
        <p style="margin: 8px 0;">🚚 Free local delivery (Westchester NY & Fairfield CT)</p>
        <p style="margin: 8px 0;">✅ 100% satisfaction guarantee</p>
      </div>

      <p>Questions? We're here to help!</p>

      <p>To better nutrition,<br>
      The NouriPet Team</p>
    `

    const html = generateSalesEmailHTML({
      subject: "Your Free Dog Nutrition Guide + 15% Off!",
      bodyContent,
    })

    const text = generateSalesEmailText({
      bodyContent,
    })

    // Send email with PDF attachment
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "NouriPet <hello@updates.nouripet.net>",
      to: [email],
      subject: "Your Free Dog Nutrition Guide + 15% Off! 🐾",
      html,
      text,
      attachments: [
        {
          filename: "NouriPet-Dog-Nutrition-Guide.pdf",
          content: pdfBase64,
        },
      ],
      tags: [
        { name: "type", value: "nutrition-guide" },
        { name: "source", value: "exit-intent" },
      ],
    })

    if (emailError) {
      console.error("[nutrition-guide] Resend error:", emailError)
      return NextResponse.json(
        { error: emailError.message || "Failed to send email" },
        { status: 500 }
      )
    }

    console.log(`[nutrition-guide] Email sent successfully: ${emailData?.id} to ${email}`)

    return NextResponse.json({
      success: true,
      emailId: emailData?.id,
      message: "Nutrition guide sent successfully",
    })
  } catch (error: any) {
    console.error("[nutrition-guide] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send nutrition guide" },
      { status: 500 }
    )
  }
}
