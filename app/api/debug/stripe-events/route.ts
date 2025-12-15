import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })

  try {
    // Get recent Stripe events
    const { data: events, error: eventsError } = await supabase
      .from("stripe_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    if (eventsError) {
      return NextResponse.json({ error: "Failed to fetch events", details: eventsError }, { status: 500 })
    }

    // Get current subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false })

    if (subsError) {
      return NextResponse.json({ error: "Failed to fetch subscriptions", details: subsError }, { status: 500 })
    }

    // Get plans with Stripe data
    const { data: plans, error: plansError } = await supabase
      .from("plans")
      .select("*")
      .not("stripe_session_id", "is", null)
      .order("created_at", { ascending: false })

    if (plansError) {
      return NextResponse.json({ error: "Failed to fetch plans", details: plansError }, { status: 500 })
    }

    return NextResponse.json({
      stripe_events: events || [],
      subscriptions: subscriptions || [],
      plans_with_stripe_data: plans || [],
      summary: {
        total_events: events?.length || 0,
        total_subscriptions: subscriptions?.length || 0,
        plans_with_stripe: plans?.length || 0,
        checkout_completed_events: events?.filter((e) => e.type === "checkout.session.completed").length || 0,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Unexpected error", details: error }, { status: 500 })
  }
}
