import { NextRequest, NextResponse } from "next/server"
import { createClient, supabaseAdmin } from "@/lib/supabase/server"
import { Resend } from "resend"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ poId: string }> }
) {
  try {
    const { poId } = await params
    const supabase = await createClient()

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Fetch PO with vendor and line items
    const { data: po, error: poError } = await supabaseAdmin
      .from("purchase_orders")
      .select(`
        *,
        vendors (
          name,
          contact_email,
          contact_name
        )
      `)
      .eq("id", poId)
      .single()

    if (poError || !po) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 })
    }

    // Fetch line items
    const { data: items, error: itemsError } = await supabaseAdmin
      .from("purchase_order_items")
      .select("*")
      .eq("po_id", poId)
      .order("ingredient_name")

    if (itemsError) {
      return NextResponse.json({ error: "Failed to fetch PO items" }, { status: 500 })
    }

    // Format dates
    const neededByDate = new Date(po.needed_by_date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })

    const pickupDate = new Date(po.pickup_date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })

    const pickupTime = po.pickup_time || '10:00 AM'

    // Format line items for email
    const itemsList = items
      .map((item: any) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.ingredient_name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.quantity_lbs} lbs</td>
        </tr>`
      )
      .join('\n')

    const totalLbs = items.reduce((sum: number, item: any) => sum + parseFloat(item.quantity_lbs), 0)

    // Create HTML email
    const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Purchase Order ${po.po_number}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #22c55e; margin: 0 0 10px 0;">NouriPet Purchase Order</h1>
    <p style="margin: 0; color: #666; font-size: 14px;">Fresh Dog Food - Locally Sourced</p>
  </div>

  <div style="background: white; padding: 20px; border: 2px solid #22c55e; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 15px 0; color: #333;">Order Details</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">PO Number:</td>
        <td style="padding: 8px 0;">${po.po_number}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Order Date:</td>
        <td style="padding: 8px 0;">${new Date(po.order_date).toLocaleDateString()}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Needed By:</td>
        <td style="padding: 8px 0; color: #dc2626; font-weight: bold;">${neededByDate}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Pickup Date:</td>
        <td style="padding: 8px 0; color: #22c55e; font-weight: bold;">${pickupDate}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Pickup Time:</td>
        <td style="padding: 8px 0;">${pickupTime}</td>
      </tr>
    </table>
  </div>

  <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 15px 0; color: #333;">Items Requested</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f8f9fa;">
          <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Ingredient</th>
          <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">Quantity</th>
        </tr>
      </thead>
      <tbody>
        ${itemsList}
      </tbody>
      <tfoot>
        <tr style="background: #f8f9fa; font-weight: bold;">
          <td style="padding: 12px 8px; border-top: 2px solid #e5e7eb;">TOTAL</td>
          <td style="padding: 12px 8px; text-align: right; border-top: 2px solid #e5e7eb;">${totalLbs.toFixed(1)} lbs</td>
        </tr>
      </tfoot>
    </table>
  </div>

  ${po.notes ? `
  <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 4px; margin-bottom: 20px;">
    <p style="margin: 0; font-weight: bold; color: #92400e;">Additional Notes:</p>
    <p style="margin: 5px 0 0 0; color: #92400e;">${po.notes}</p>
  </div>
  ` : ''}

  <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
    <p style="margin: 0 0 10px 0; font-weight: bold;">Please confirm availability at your earliest convenience.</p>
    <p style="margin: 0; color: #666; font-size: 14px;">Thank you for your continued partnership!</p>
  </div>

  <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; color: #666; font-size: 14px;">
    <p style="margin: 0 0 5px 0;"><strong>NouriPet</strong></p>
    <p style="margin: 0 0 5px 0;">Phone: (203) 208-6186</p>
    <p style="margin: 0;">Email: orders@nouripet.net</p>
  </div>
</body>
</html>
    `.trim()

    // Create plain text version
    const textEmail = `
NouriPet Purchase Order

ORDER DETAILS
PO Number: ${po.po_number}
Order Date: ${new Date(po.order_date).toLocaleDateString()}
Needed By: ${neededByDate}
Pickup Date: ${pickupDate}
Pickup Time: ${pickupTime}

ITEMS REQUESTED
${items.map((item: any) => `• ${item.ingredient_name}: ${item.quantity_lbs} lbs`).join('\n')}

TOTAL: ${totalLbs.toFixed(1)} lbs

${po.notes ? `NOTES:\n${po.notes}\n` : ''}
Please confirm availability at your earliest convenience.
Thank you for your continued partnership!

---
NouriPet
Phone: (203) 208-6186
Email: orders@nouripet.net
    `.trim()

    // Split email addresses (stored as comma-separated)
    const emailRecipients = po.vendors.contact_email.split(',').map((email: string) => email.trim())

    // Send email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "NouriPet Orders <orders@nouripet.net>",
      to: emailRecipients,
      subject: `NouriPet Purchase Order ${po.po_number} - Pickup ${pickupDate}`,
      html: htmlEmail,
      text: textEmail,
      tags: [
        { name: "type", value: "purchase_order" },
        { name: "po_number", value: po.po_number },
      ],
    })

    if (emailError) {
      console.error("Resend error:", emailError)
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    // Update PO status to 'sent'
    await supabaseAdmin
      .from("purchase_orders")
      .update({ status: "sent" })
      .eq("id", poId)

    console.log(`[PO Email] Sent PO ${po.po_number} to ${po.vendors.contact_email}`)

    return NextResponse.json({
      success: true,
      emailId: emailData?.id,
      message: "Purchase order email sent successfully",
    })
  } catch (error: any) {
    console.error("Error sending PO email:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    )
  }
}
