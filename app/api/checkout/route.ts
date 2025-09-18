export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { stripe } from "@/lib/stripe"

function reqEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env ${name}`)
  return v
}

export async function POST() {
  try {
    console.log("[v0] Starting checkout API request")

    const cookieStore = cookies()
    const supabase = createServerClient(reqEnv("NEXT_PUBLIC_SUPABASE_URL"), reqEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set() {},
        remove() {},
      },
    })

    console.log("[v0] Supabase client created, checking auth")
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      console.log("[v0] No authenticated user found")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    console.log("[v0] User authenticated:", user.id)

    // Query plans and plan items directly instead of using the view
    console.log("[v0] Fetching checkout lines from database")
    const { data: plans, error: plansError } = await supabase
      .from("plans")
      .select(`
        id,
        total_cents,
        plan_items (
          id,
          recipe_id,
          qty,
          unit_price_cents,
          amount_cents,
          billing_interval,
          stripe_price_id,
          recipes (name, slug)
        )
      `)
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)

    if (plansError) {
      console.log("[v0] Database error fetching plans:", plansError)
      return NextResponse.json({ error: `Database error: ${plansError.message}` }, { status: 400 })
    }

    if (!plans || plans.length === 0) {
      console.log("[v0] No checkout data found")
      return NextResponse.json({ error: "No checkout lines found" }, { status: 400 })
    }

    // Get the most recent plan
    const checkout = {
      plan_id: plans[0].id,
      total_cents: plans[0].total_cents,
      line_items: plans[0].plan_items || []
    }
    console.log("[v0] Using checkout data:", JSON.stringify(checkout, null, 2))

    const planId: string = checkout.plan_id
    const lines = (checkout.line_items ?? []) as any[]

    if (!lines.length) {
      console.log("[v0] No line items in checkout")
      return NextResponse.json({ error: "No items in plan" }, { status: 400 })
    }

    console.log("[v0] Processing", lines.length, "line items")
    console.log("[v0] Line items data:", JSON.stringify(lines, null, 2))

    // All plan_items must have a Stripe price id
    const raw_line_items = lines.map((li, index) => {
      console.log(`[v0] Processing line item ${index}:`, JSON.stringify(li, null, 2))
      if (!li.stripe_price_id) {
        console.log(`[v0] Missing stripe_price_id on line item ${index}`)
        throw new Error(`Missing stripe_price_id on plan item ${index}; run price sync / set_plan_item_price.`)
      }
      return { price: li.stripe_price_id as string, quantity: li.qty ?? 1 }
    })

    // Consolidate line items by price ID to avoid duplicates
    const line_items_map = new Map<string, number>()
    raw_line_items.forEach(item => {
      const existing = line_items_map.get(item.price) || 0
      line_items_map.set(item.price, existing + item.quantity)
    })

    const line_items = Array.from(line_items_map.entries()).map(([price, quantity]) => ({
      price,
      quantity
    }))

    console.log("[v0] Consolidated line items:", line_items)

    console.log("[v0] Line items for Stripe:", line_items)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.nouripet.net"
    const successUrl = `${baseUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/checkout/cancelled`

    console.log("[v0] Creating Stripe checkout session")
    console.log("[v0] Success URL:", successUrl)
    console.log("[v0] Cancel URL:", cancelUrl)

    const session = await stripe.checkout.sessions.create({
      mode: "subscription", // change to "payment" if one-time
      line_items,
      subscription_data: {
        metadata: {
          plan_id: planId,
          user_id: user.id,
        },
      },
      client_reference_id: planId,
      metadata: { plan_id: planId, user_id: user.id },
      customer_email: user.email ?? undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    })

    console.log("[v0] Stripe session created:", session.id)

    // Mark plan "in progress" and store session id immediately
    console.log("[v0] Updating plan status to checkout_in_progress")
    const { error: updateError } = await supabase
      .from("plans")
      .update({ status: "checkout_in_progress", stripe_session_id: session.id })
      .eq("id", planId)

    if (updateError) {
      console.log("[v0] Error updating plan status:", updateError)
      // Don't fail the checkout, just log the error
    }

    console.log("[v0] Checkout API completed successfully")
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("[v0] Checkout API error:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("[v0] Error details:", JSON.stringify(error, null, 2))

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
