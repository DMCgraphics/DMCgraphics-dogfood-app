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

    // Fetch topper subscriptions from database (plan_id is NULL for topper subscriptions)
    const { data: dbSubscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .is('plan_id', null) // Topper subscriptions have NULL plan_id
      .order('created_at', { ascending: false })

    if (subError) {
      console.error('[TOPPER-ORDERS] Error fetching subscriptions from database:', subError)
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
    }

    console.log('[TOPPER-ORDERS] Database subscriptions found:', dbSubscriptions?.length || 0)

    // Fetch fresh data from Stripe for each subscription
    const subscriptions = await Promise.all(
      (dbSubscriptions || []).map(async (dbSub) => {
        try {
          const stripeSub = await stripe.subscriptions.retrieve(dbSub.stripe_subscription_id)
          const metadata = stripeSub.metadata || dbSub.metadata || {}
          const isPaused = !!stripeSub.pause_collection

          // Extract product type from topper_level or product_type, strip "topper-" prefix if present
          let productType = metadata.topper_level?.replace('%', '') ||
                           metadata.product_type ||
                           getTopperLevelFromPrice(stripeSub.items.data[0]?.price?.unit_amount || 0)
          if (productType.startsWith('topper-')) {
            productType = productType.replace('topper-', '')
          }

          console.log('[TOPPER-ORDERS] Subscription:', stripeSub.id, 'product_type:', metadata.product_type, 'cleaned:', productType, 'dog_id:', metadata.dog_id)

          return {
            id: stripeSub.id,
            status: isPaused ? 'paused' : stripeSub.status,
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000).toISOString(),
            currentPeriodStart: new Date(stripeSub.current_period_start * 1000).toISOString(),
            created: new Date(stripeSub.created * 1000).toISOString(),
            dogId: metadata.dog_id || dbSub.metadata?.dog_id || '',
            dogName: metadata.dog_name || dbSub.metadata?.dog_name || '',
            dogSize: metadata.dog_size || dbSub.metadata?.dog_size || 'medium',
            productType,
            amount: stripeSub.items.data[0]?.price?.unit_amount || 0,
            interval: 'bi-weekly',
            isPaused,
          }
        } catch (err) {
          console.error('[TOPPER-ORDERS] Error fetching Stripe subscription:', dbSub.stripe_subscription_id, err)
          // Return subscription data from database if Stripe fetch fails
          const metadata = dbSub.metadata || {}
          let productType = metadata.topper_level?.replace('%', '') ||
                           metadata.product_type ||
                           '25'
          if (productType.startsWith('topper-')) {
            productType = productType.replace('topper-', '')
          }

          return {
            id: dbSub.stripe_subscription_id,
            status: dbSub.status,
            cancelAtPeriodEnd: false,
            currentPeriodEnd: dbSub.current_period_end,
            currentPeriodStart: dbSub.current_period_start,
            created: dbSub.created_at,
            dogId: metadata.dog_id || '',
            dogName: metadata.dog_name || '',
            dogSize: metadata.dog_size || 'medium',
            productType,
            amount: 0,
            interval: 'bi-weekly',
            isPaused: false,
          }
        }
      })
    )

    console.log('[TOPPER-ORDERS] Mapped subscriptions:', JSON.stringify(subscriptions, null, 2))

    // Get all unique Stripe customer IDs from subscriptions
    const customerIds = new Set(
      (dbSubscriptions || [])
        .map(sub => sub.stripe_customer_id)
        .filter(Boolean)
    )

    console.log('[TOPPER-ORDERS] Unique customer IDs:', Array.from(customerIds))

    // Fetch recent payment intents for all customer IDs to find one-time topper/pack purchases
    let allOneTimePayments: any[] = []

    if (customerIds.size > 0) {
      for (const customerId of customerIds) {
        try {
          const paymentIntents = await stripe.paymentIntents.list({
            customer: customerId as string,
            limit: 50,
          })

          // Filter for successful one-time payments (not subscription-related)
          const oneTimePayments = paymentIntents.data.filter(pi => {
            const metadata = pi.metadata || {}
            const isOneTime = !pi.invoice // One-time payments don't have an invoice
            const isTopperProduct = metadata.product_type === 'individual' || metadata.product_type === '3-packs'
            return pi.status === 'succeeded' && isOneTime && isTopperProduct
          })

          allOneTimePayments.push(...oneTimePayments)
        } catch (err) {
          console.error('[TOPPER-ORDERS] Error fetching payment intents for customer:', customerId, err)
        }
      }
    }

    const orders = allOneTimePayments.map(pi => {
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

    console.log('[TOPPER-ORDERS] One-time orders found:', orders.length)

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
