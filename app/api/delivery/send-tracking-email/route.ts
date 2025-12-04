import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"
import { Resend } from "resend"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function generateTrackingEmailHTML(data: {
  customerName: string
  orderNumber: string
  trackingUrl: string
  deliveryDate?: string
  deliveryWindow?: string
  recipes?: string
}) {
  const {
    customerName,
    orderNumber,
    trackingUrl,
    deliveryDate = "Soon",
    deliveryWindow = "9:00 AM - 5:00 PM",
    recipes = "Fresh dog food"
  } = data

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>NouriPet — Order Tracking</title>
<style type="text/css">
  body { margin:0; padding:0; background:#f6f7fb; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; color:#1f2937; }
  a { color:#0ea5e9; text-decoration:none; }
  .wrapper { width:100%; background:#f6f7fb; padding:24px 12px; }
  .container { max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
  .header { padding:20px 24px; background:#ffffff; border-bottom:1px solid #eef2f7; }
  .logo { width:70px; height:auto; display:block; }
  .hero { padding:28px 24px 8px; }
  .tag { display:inline-block; font-size:12px; letter-spacing:.5px; text-transform:uppercase; background:#dcfce7; color:#14532d; padding:6px 10px; border-radius:999px; }
  h1 { margin:14px 0 6px; font-size:24px; line-height:1.3; }
  p { margin:12px 0; font-size:16px; line-height:1.6; color:#334155; }
  .card { background:#f8fafc; border:1px solid #e5e7eb; border-radius:12px; padding:16px; margin:12px 0 4px; }
  .mini { font-size:13px; color:#475569; }
  .b { font-weight:600; color:#0f172a; }
  .btnbar { text-align:center; padding:18px 16px 26px; }
  .btn { background:#0ea5e9; color:#fff !important; padding:14px 22px; border-radius:10px; display:inline-block; font-weight:600; text-decoration:none; }
  .divider { height:1px; background:#eef2f7; margin:20px 0; }
  .footer { padding:16px 24px 28px; color:#6b7280; font-size:13px; }
  @media (prefers-color-scheme: dark) {
    body { background:#0b1220; color:#e5e7eb; }
    .container { background:#0f172a; box-shadow:none; }
    .header { background:#0f172a; border-bottom:1px solid #111827; }
    .hero p, p { color:#cbd5e1; }
    .card { background:#111827; border-color:#1f2937; }
    .divider { background:#1f2937; }
    .footer { color:#9ca3af; }
    .tag { background:#052e16; color:#bbf7d0; }
    .btn { background:#38bdf8; }
  }
</style>
</head>
<body>
<div class="wrapper">
  <div class="container">
    <div class="header">
      <img class="logo" src="https://mcusercontent.com/b93f484f5e48093398a4a8238/images/110a6f3a-ebc8-564b-616c-30893c78ad11.png" alt="NouriPet">
    </div>

    <div class="hero">
      <span class="tag">Order Confirmed</span>
      <h1>Hi ${customerName}, your order is being prepared! 📦</h1>
      <p class="mini">Great news! Your NouriPet subscription order (<span class="b">${orderNumber}</span>) has been confirmed and is being prepared for delivery.</p>
      <p class="mini"><span class="b">Estimated Delivery:</span> ${deliveryDate} • <span class="b">Window:</span> ${deliveryWindow}</p>
    </div>

    <div class="card">
      <h2 style="margin:0 0 10px;font-size:18px;">What's in this delivery</h2>
      <p class="mini">• Recipes: <span class="b">${recipes}</span></p>
    </div>

    <div class="btnbar">
      <a href="${trackingUrl}" class="btn">Track Your Order</a>
    </div>

    <div class="card">
      <h3 style="margin:0 0 6px;font-size:16px;">Track your delivery</h3>
      <p class="mini">Click the button above to track your order in real-time. You'll be able to see when your order is being prepared, when it's out for delivery, and when it's delivered.</p>
      <p class="mini">You can also copy this link to track your order: <a href="${trackingUrl}">${trackingUrl}</a></p>
    </div>

    <div class="divider"></div>

    <div class="footer">
      Questions? Reply here or text <b>‪(203) 208-6186‬</b>.<br>
      NouriPet • Fresh, local meals for happier dogs 🐶
    </div>
  </div>
</div>
</body>
</html>`
}

export async function POST(req: Request) {
  // Initialize Resend only when needed (not at build time)
  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const body = await req.json()
    const { orderId, customerEmail, customerName, orderNumber, trackingToken, deliveryDate, deliveryWindow, recipes } = body

    if (!orderId || !customerEmail || !trackingToken) {
      return NextResponse.json(
        { error: "Order ID, customer email, and tracking token are required" },
        { status: 400 }
      )
    }

    // Generate tracking URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nouripet.net'
    const trackingUrl = `${baseUrl}/order/track/${orderId}?token=${trackingToken}`

    // Generate HTML email
    const html = generateTrackingEmailHTML({
      customerName: customerName || 'Customer',
      orderNumber: orderNumber || 'N/A',
      trackingUrl,
      deliveryDate,
      deliveryWindow,
      recipes
    })

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: "NouriPet <no-reply@updates.nouripet.net>",
      to: [customerEmail],
      subject: `Track Your NouriPet Order ${orderNumber ? `(${orderNumber})` : ''}`,
      html: html,
    })

    if (error) {
      console.error("[tracking-email] Error sending email:", error)
      return NextResponse.json(
        { error: error.message || "Failed to send email" },
        { status: 500 }
      )
    }

    // Log the email send
    console.log(`[tracking-email] Email sent to ${customerEmail}:`, {
      orderId,
      orderNumber,
      email_id: data?.id
    })

    return NextResponse.json({
      success: true,
      message: "Tracking email sent successfully",
      id: data?.id
    })
  } catch (error: any) {
    console.error("[tracking-email] Error sending email:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    )
  }
}
