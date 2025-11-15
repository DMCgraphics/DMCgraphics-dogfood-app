import { NextResponse } from "next/server"
import { createServerSupabase, supabaseAdmin } from "@/lib/supabase/server"
import { Resend } from "resend"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function generateDeliveryEmailHTML(data: {
  dogName: string
  customerName: string
  deliveryDate?: string
  deliveryWindow?: string
  planDetails?: string
  recipes?: string
  schedule?: string
  totalPacks?: string
  portionPerMeal?: string
  dailyTotal?: string
}) {
  const {
    dogName,
    customerName,
    deliveryDate = new Date().toLocaleDateString(),
    deliveryWindow = "9:00 AM - 5:00 PM",
    planDetails = "Custom meal plan",
    recipes = "Fresh dog food",
    schedule = "As scheduled",
    totalPacks = "7 (8 oz each)",
    portionPerMeal = "1 cup",
    dailyTotal = "2 cups"
  } = data

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>NouriPet — Out for Delivery</title>
<style type="text/css">
  body { margin:0; padding:0; background:#f6f7fb; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; color:#1f2937; }
  a { color:#0ea5e9; text-decoration:none; }
  .wrapper { width:100%; background:#f6f7fb; padding:24px 12px; }
  .container { max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
  .header { padding:20px 24px; background:#ffffff; border-bottom:1px solid #eef2f7; }
  .logo { width:70px; height:auto; display:block; }
  .hero { padding:28px 24px 8px; }
  .tag { display:inline-block; font-size:12px; letter-spacing:.5px; text-transform:uppercase; background:#fef3c7; color:#92400e; padding:6px 10px; border-radius:999px; }
  h1 { margin:14px 0 6px; font-size:24px; line-height:1.3; }
  p { margin:12px 0; font-size:16px; line-height:1.6; color:#334155; }
  .card { background:#f8fafc; border:1px solid #e5e7eb; border-radius:12px; padding:16px; margin:12px 0 4px; }
  .mini { font-size:13px; color:#475569; }
  .b { font-weight:600; color:#0f172a; }
  .btnbar { text-align:center; padding:18px 16px 26px; }
  .btn { background:#0ea5e9; color:#fff !important; padding:14px 22px; border-radius:10px; display:inline-block; font-weight:600; }
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
    .tag { background:#3a2e10; color:#fde68a; }
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
      <span class="tag">Out for delivery</span>
      <h1>${dogName}'s meals are on the way 🚚</h1>
      <p class="mini">We're delivering today, <span class="b">${deliveryDate}</span>, with an estimated window of <span class="b">${deliveryWindow}</span>. We'll bring ${dogName}'s meals directly to your door and you'll receive a confirmation as soon as the cooler is dropped off.</p>
      <p class="mini"><span class="b">Plan:</span> ${planDetails} • <span class="b">Recipes:</span> ${recipes} • <span class="b">Schedule:</span> ${schedule}</p>
    </div>

    <div class="card">
      <h2 style="margin:0 0 10px;font-size:18px;">What to expect</h2>
      <ul style="margin:8px 0 0 18px; padding:0;">
        <li style="margin:6px 0;">Meals arrive in insulated packaging with gel packs to keep everything cold.</li>
        <li style="margin:6px 0;">Each pack is labeled with <b>${dogName}'s</b> name, recipe, portion, and date prepared.</li>
        <li style="margin:6px 0;">Please refrigerate on arrival. Use within <b>3 days</b> or freeze for later.</li>
      </ul>
    </div>

    <div class="card">
      <h3 style="margin:0 0 6px;font-size:16px;">What's in today's delivery</h3>
      <p class="mini">• Recipe(s): <span class="b">${recipes}</span><br>
         • Total packs: <span class="b">${totalPacks}</span><br>
         • Portion (per meal): <span class="b">${portionPerMeal}</span><br>
         • Daily total: <span class="b">${dailyTotal}</span></p>
    </div>

    <div class="divider"></div>

    <div class="footer">
      Questions or need a doorstep placement note? Reply here or text <b>‪(475) 208-3769‬</b>.<br>
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
    const { to, dogName, customerName, deliveryDate, deliveryWindow, planDetails, recipes, schedule } = body

    if (!to || !dogName || !customerName) {
      return NextResponse.json(
        { error: "Email, dog name, and customer name are required" },
        { status: 400 }
      )
    }

    // Generate HTML email
    const html = generateDeliveryEmailHTML({
      dogName,
      customerName,
      deliveryDate,
      deliveryWindow,
      planDetails,
      recipes,
      schedule
    })

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: "NouriPet Delivery <no-reply@updates.nouripet.net>",
      to: [to],
      subject: `${dogName}'s meals are on the way 🚚`,
      html: html,
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
      dogName,
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
