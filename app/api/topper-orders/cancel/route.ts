import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"
import Stripe from "stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { type, id } = await req.json()

    if (!type || !id) {
      return NextResponse.json(
        { error: "Missing type or id" },
        { status: 400 }
      )
    }

    if (type === 'subscription') {
      // Cancel topper subscription at period end
      const subscription = await stripe.subscriptions.update(id, {
        cancel_at_period_end: true,
      })

      return NextResponse.json({
        success: true,
        message: "Subscription will be cancelled at the end of the current period",
        subscription: {
          id: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        }
      })
    } else if (type === 'order') {
      // For one-time orders, the ID is the payment intent ID
      // First retrieve the payment intent to verify and check timing
      const paymentIntent = await stripe.paymentIntents.retrieve(id)

      if (!paymentIntent) {
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 }
        )
      }

      // Check if within 24-hour cancellation window
      const orderAge = Date.now() - paymentIntent.created * 1000
      const twentyFourHours = 24 * 60 * 60 * 1000

      if (orderAge > twentyFourHours) {
        return NextResponse.json(
          { error: "Cancellation window has expired. Orders can only be cancelled within 24 hours." },
          { status: 400 }
        )
      }

      // Refund the payment
      const refund = await stripe.refunds.create({
        payment_intent: id,
        reason: 'requested_by_customer',
      })

      return NextResponse.json({
        success: true,
        message: "Order cancelled and refund initiated",
        refund: {
          id: refund.id,
          status: refund.status,
          amount: refund.amount,
        }
      })
    } else {
      return NextResponse.json(
        { error: "Invalid type. Must be 'subscription' or 'order'" },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error("Error cancelling:", error)
    return NextResponse.json(
      { error: error.message || "Failed to cancel" },
      { status: 500 }
    )
  }
}
