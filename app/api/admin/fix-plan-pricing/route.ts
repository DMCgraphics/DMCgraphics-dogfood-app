import { NextResponse } from "next/server"
import { createServerSupabase, supabaseAdmin } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    // Check admin permission
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin, roles")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin && !profile?.roles?.includes('admin')) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    const { planId } = await req.json()

    if (!planId) {
      return NextResponse.json({ error: "planId required" }, { status: 400 })
    }

    console.log(`[fix-pricing] Fixing pricing for plan ${planId}`)

    // Get plan and subscription
    const { data: plan } = await supabaseAdmin
      .from("plans")
      .select(`
        id,
        user_id,
        dog_id,
        total_cents,
        stripe_subscription_id,
        subscriptions!inner(stripe_subscription_id)
      `)
      .eq("id", planId)
      .single()

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    // Get Stripe subscription ID from the subscription record
    const stripeSubId = plan.stripe_subscription_id || (plan.subscriptions as any)?.stripe_subscription_id

    if (!stripeSubId) {
      return NextResponse.json({ error: "No Stripe subscription ID found" }, { status: 400 })
    }

    console.log(`[fix-pricing] Fetching Stripe subscription ${stripeSubId}`)

    // Fetch from Stripe
    const stripeSub = await stripe.subscriptions.retrieve(stripeSubId, {
      expand: ['items.data.price.product']
    })

    const totalCents = stripeSub.items.data[0].price.unit_amount || 0
    const stripePriceId = stripeSub.items.data[0].price.id
    const billingInterval = stripeSub.items.data[0].price.recurring?.interval || 'week'

    console.log(`[fix-pricing] Found pricing: $${totalCents / 100}`)

    // Update plan
    await supabaseAdmin
      .from("plans")
      .update({
        total_cents: totalCents,
        stripe_subscription_id: stripeSubId,
        snapshot: {
          total_cents: totalCents,
          recipes: [],
          billing_cycle: billingInterval
        }
      })
      .eq("id", planId)

    console.log(`[fix-pricing] Updated plan ${planId}`)

    // Get plan_items
    const { data: planItems } = await supabaseAdmin
      .from("plan_items")
      .select("*")
      .eq("plan_id", planId)

    if (planItems && planItems.length > 0) {
      const unitPrice = Math.floor(totalCents / planItems.length)

      // Update each plan_item
      for (const item of planItems) {
        await supabaseAdmin
          .from("plan_items")
          .update({
            unit_price_cents: unitPrice,
            stripe_price_id: stripePriceId,
            billing_interval: billingInterval
          })
          .eq("id", item.id)
      }

      console.log(`[fix-pricing] Updated ${planItems.length} plan items`)
    }

    // Update any orders
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("id, total_cents")
      .eq("stripe_subscription_id", stripeSubId)
      .eq("total_cents", 0)

    if (orders && orders.length > 0) {
      for (const order of orders) {
        await supabaseAdmin
          .from("orders")
          .update({
            total_cents: totalCents,
            total: totalCents / 100
          })
          .eq("id", order.id)
      }

      console.log(`[fix-pricing] Updated ${orders.length} orders`)
    }

    return NextResponse.json({
      success: true,
      message: `Fixed pricing for plan ${planId}`,
      totalCents,
      planItemsUpdated: planItems?.length || 0,
      ordersUpdated: orders?.length || 0
    })

  } catch (error: any) {
    console.error("[fix-pricing] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fix pricing" },
      { status: 500 }
    )
  }
}
