// app/api/checkout/route.ts
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerSupabase } from "@/lib/supabase/server"

function requireEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing ${name}`)
  return v
}

// Healthcheck so opening this URL in a browser doesn't explode
export function GET() {
  return NextResponse.json({
    ok: true,
    note: "Use POST to create a Checkout Session.",
    env: {
      NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    },
  })
}

export async function POST(req: Request) {
  // ✅ Instantiate Stripe inside the handler (prevents import-time env access)
  const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"), { apiVersion: "2024-06-20" })

  // We’ll build line_items from the user’s current plan in Supabase
  const supabase = createServerSupabase()

  // Require an authenticated user
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()
  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Grab the latest in-progress plan
  const { data: currentPlan, error: planErr } = await supabase
    .from("current_user_plan")
    .select("id")
    .single()

  const planId = currentPlan?.id
  if (planErr || !planId) {
    return NextResponse.json({ error: "No active plan found" }, { status: 400 })
  }

  // Load plan items (must include stripe_price_id per item)
  const { data: planItems, error: planItemsError } = await supabase
    .from("plan_items")
    .select("id, qty, stripe_price_id")
    .eq("plan_id", planId)

  if (planItemsError || !planItems?.length) {
    console.error("[checkout] Plan items error:", planItemsError)
    return NextResponse.json({ error: "No plan items found" }, { status: 400 })
  }

  // Ensure a Stripe customer if one already exists for this user
  const { data: billingCustomer } = await supabase
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single()

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = []

  for (const item of planItems) {
    if (!item.stripe_price_id) {
      console.error("[checkout] Missing stripe_price_id for plan item:", item.id)
      return NextResponse.json({ error: `Missing Stripe price ID for plan item ${item.id}` }, { status: 500 })
    }
    line_items.push({
      price: item.stripe_price_id,
      quantity: Math.max(1, Number(item.qty) || 1),
    })
  }

  if (!line_items.length) {
    return NextResponse.json({ error: "No Stripe line_items could be built" }, { status: 500 })
  }

  // Build URLs from canonical site URL if provided, else derive from request
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin
  const success_url = `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
  const cancel_url = `${siteUrl}/checkout`

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items,
    success_url,
    cancel_url,
    customer: billingCustomer?.stripe_customer_id || undefined,
    customer_email: billingCustomer ? undefined : (user.email ?? undefined),
    allow_promotion_codes: true,
    metadata: { plan_id: planId, user_id: user.id },
    subscription_data: { metadata: { plan_id: planId, user_id: user.id } },
  })

  // Redirect the browser to Stripe Checkout
  return NextResponse.redirect(session.url!, 303)
}
