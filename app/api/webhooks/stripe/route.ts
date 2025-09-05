// app/api/webhooks/stripe/route.ts
export const runtime = "nodejs"

import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

function requireEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing ${name}`)
  return v
}

// Quick GET healthcheck so you can verify envs fast in prod
export function GET() {
  return NextResponse.json({
    ok: true,
    env: {
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    note: "POST requests must come from Stripe (raw body).",
  })
}

export async function POST(req: Request) {
  try {
    const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"), { apiVersion: "2024-06-20" })
    const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false },
    })

    const body = await req.text()
    const sig = headers().get("stripe-signature")
    if (!sig) return new NextResponse("Missing stripe-signature header", { status: 400 })

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, sig, requireEnv("STRIPE_WEBHOOK_SECRET"))
    } catch (err: any) {
      console.error("❌ Webhook verify failed:", err?.message)
      return new NextResponse(`Webhook Error: ${err?.message}`, { status: 400 })
    }

    // Record the event (idempotent-ish)
    try {
      await supabase.from("stripe_events").insert({
        id: event.id,
        type: event.type,
        payload: event.data.object,
      })
    } catch {
      // ignore unique violation
    }

    // Handle events
    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session
          console.log("💰 checkout.session.completed", session.id)
          if (session.metadata?.user_id && session.customer) {
            await supabase.from("billing_customers").upsert({
              user_id: session.metadata.user_id,
              stripe_customer_id: session.customer as string,
            })
          }
          break
        }

        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const s = event.data.object as Stripe.Subscription
          console.log(`📋 ${event.type}:`, s.id)

          if (s.metadata?.user_id && s.metadata?.plan_id) {
            await supabase.from("subscriptions").upsert({
              user_id: s.metadata.user_id,
              plan_id: s.metadata.plan_id,
              stripe_subscription_id: s.id,
              status: s.status,
              price_id: s.items.data[0]?.price.id,
              current_period_start: new Date(s.current_period_start * 1000).toISOString(),
              current_period_end: new Date(s.current_period_end * 1000).toISOString(),
              metadata: s.metadata,
            })

            await supabase.from("plans").update({
              status: "active",
              stripe_subscription_id: s.id,
            }).eq("id", s.metadata.plan_id)
          }
          break
        }

        case "invoice.paid": {
          const inv = event.data.object as Stripe.Invoice
          console.log("✅ invoice.paid", inv.id)
          if (inv.subscription) {
            const { error } = await supabase.rpc("create_order_from_plan", {
              subscription_id: inv.subscription as string,
              invoice_id: inv.id,
            })
            if (error) console.error("create_order_from_plan error:", error)
          }
          break
        }

        case "invoice.payment_failed":
          console.log("❌ invoice.payment_failed", event.data.object["id"])
          break

        default:
          console.log(`(ignored) ${event.type}`)
      }
    } catch (err) {
      console.error("❌ Handler error:", err)
      // fall through; return 200 so Stripe doesn’t retry forever
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("Fatal webhook error:", err?.message)
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 })
  }
}
