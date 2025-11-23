import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"
import Stripe from "stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

export async function GET(req: Request) {
  try {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First, find or get the Stripe customer for this user
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    })

    if (customers.data.length === 0) {
      // No Stripe customer found - user hasn't made any purchases
      return NextResponse.json({
        subscriptions: [],
        orders: [],
      })
    }

    const customerId = customers.data[0].id

    // Fetch subscriptions for topper products
    const subscriptionsList = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 100,
    })

    // Filter for topper subscriptions (bi-weekly interval)
    const topperSubscriptions = subscriptionsList.data.filter(sub => {
      const price = sub.items.data[0]?.price
      // Topper subscriptions are bi-weekly (interval_count: 2, interval: week)
      return price?.recurring?.interval === 'week' && price?.recurring?.interval_count === 2
    })

    const subscriptions = topperSubscriptions.map(sub => {
      const metadata = sub.metadata || {}
      const isPaused = !!sub.pause_collection
      return {
        id: sub.id,
        status: isPaused ? 'paused' : sub.status,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
        currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
        created: new Date(sub.created * 1000).toISOString(),
        dogId: metadata.dog_id || '',
        dogName: metadata.dog_name || '',
        dogSize: metadata.dog_size || 'medium',
        productType: metadata.product_type || getTopperLevelFromPrice(sub.items.data[0]?.price?.unit_amount || 0),
        amount: sub.items.data[0]?.price?.unit_amount || 0,
        interval: 'bi-weekly',
        isPaused,
      }
    })

    // Fetch recent payment intents to find one-time topper/pack purchases
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 50,
    })

    // Filter for successful one-time payments (not subscription-related)
    const oneTimePayments = paymentIntents.data.filter(pi => {
      const metadata = pi.metadata || {}
      const isOneTime = !pi.invoice // One-time payments don't have an invoice
      const isTopperProduct = metadata.product_type === 'individual' || metadata.product_type === '3-packs'
      return pi.status === 'succeeded' && isOneTime && isTopperProduct
    })

    const orders = oneTimePayments.map(pi => {
      const metadata = pi.metadata || {}
      const createdAt = pi.created * 1000
      return {
        id: pi.id,
        paymentIntentId: pi.id,
        status: 'paid',
        created: new Date(createdAt).toISOString(),
        dogId: metadata.dog_id || '',
        dogName: metadata.dog_name || '',
        productType: metadata.product_type || 'individual',
        recipeName: metadata.recipe_name || '',
        amount: pi.amount || 0,
        // Calculate if cancellable (within 24 hours)
        canCancel: (Date.now() - createdAt) < 24 * 60 * 60 * 1000,
        cancelDeadline: new Date(createdAt + 24 * 60 * 60 * 1000).toISOString(),
      }
    })

    return NextResponse.json({
      subscriptions,
      orders,
    })
  } catch (error: any) {
    console.error("Error fetching topper orders:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch orders" },
      { status: 500 }
    )
  }
}

// Helper to guess topper level from price amount
function getTopperLevelFromPrice(amount: number): string {
  // Based on small dog prices as reference
  if (amount <= 700) return '25'
  if (amount <= 1500) return '50'
  return '75'
}
