import { NextResponse } from "next/server"
import { getAdminUser } from "@/lib/admin/auth"
import { createServerSupabase } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    // Check admin authorization
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { subscription_id, amount } = body

    if (!subscription_id) {
      return NextResponse.json({ error: "Subscription ID required" }, { status: 400 })
    }

    const supabase = createServerSupabase()

    // Get subscription from database
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("stripe_subscription_id", subscription_id)
      .single()

    if (subError || !subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    // Get the Stripe subscription to find the latest invoice
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription_id)

    if (!stripeSubscription.latest_invoice) {
      return NextResponse.json({ error: "No invoice found for this subscription" }, { status: 400 })
    }

    // Get the invoice to find the payment intent
    const invoice = await stripe.invoices.retrieve(
      typeof stripeSubscription.latest_invoice === "string"
        ? stripeSubscription.latest_invoice
        : stripeSubscription.latest_invoice.id
    )

    if (!invoice.payment_intent) {
      return NextResponse.json({ error: "No payment found for this invoice" }, { status: 400 })
    }

    const paymentIntentId = typeof invoice.payment_intent === "string"
      ? invoice.payment_intent
      : invoice.payment_intent.id

    // Create refund
    const refundParams: any = {
      payment_intent: paymentIntentId,
      reason: "requested_by_customer",
    }

    // If amount specified, add it (in cents)
    if (amount && amount > 0) {
      refundParams.amount = amount
    }

    const refund = await stripe.refunds.create(refundParams)

    // Log the refund action
    console.log(`[admin] Refund issued by ${adminUser.email}:`, {
      subscription_id,
      refund_id: refund.id,
      amount: refund.amount,
      user_id: subscription.user_id,
    })

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        created: refund.created,
      },
    })
  } catch (error: any) {
    console.error("[admin] Error issuing refund:", error)
    return NextResponse.json(
      { error: error.message || "Failed to issue refund" },
      { status: 500 }
    )
  }
}
