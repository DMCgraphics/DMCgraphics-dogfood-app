export const runtime = "nodejs"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerSupabase } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const { subscriptionId } = await req.json()
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })
  const sub = await stripe.subscriptions.update(subscriptionId, {
    pause_collection: "", // Clear pause to resume
  })

  await supabase
    .from("subscriptions")
    .update({
      status: sub.status,
      pause_json: sub.pause_collection ?? null,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId)
    .eq("user_id", user.id)

  return NextResponse.json({ ok: true })
}
