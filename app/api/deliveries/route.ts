import { NextResponse } from "next/server"
import { createServerSupabase, supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET - Fetch deliveries for the current user
export async function GET(req: Request) {
  try {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status") // Optional filter

    let query = supabaseAdmin
      .from("deliveries")
      .select(`
        *,
        plans (
          id,
          dog_id,
          dogs (name, breed)
        )
      `)
      .eq("user_id", user.id)
      .order("scheduled_date", { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq("status", status)
    }

    const { data: deliveries, error } = await query

    if (error) {
      console.error("Error fetching deliveries:", error)
      return NextResponse.json(
        { error: "Failed to fetch deliveries" },
        { status: 500 }
      )
    }

    return NextResponse.json({ deliveries })
  } catch (error: any) {
    console.error("Error in deliveries API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create a new delivery (admin/system use)
export async function POST(req: Request) {
  try {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin, roles")
      .eq("id", user.id)
      .single()

    const isAdmin = profile?.is_admin || profile?.roles?.includes("admin")
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const {
      user_id,
      subscription_id,
      plan_id,
      scheduled_date,
      items,
      delivery_address_line1,
      delivery_address_line2,
      delivery_city,
      delivery_state,
      delivery_zipcode,
    } = body

    if (!user_id || !scheduled_date) {
      return NextResponse.json(
        { error: "user_id and scheduled_date are required" },
        { status: 400 }
      )
    }

    const { data: delivery, error } = await supabaseAdmin
      .from("deliveries")
      .insert({
        user_id,
        subscription_id,
        plan_id,
        scheduled_date,
        items: items || [],
        delivery_address_line1,
        delivery_address_line2,
        delivery_city,
        delivery_state,
        delivery_zipcode,
        status: "scheduled",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating delivery:", error)
      return NextResponse.json(
        { error: "Failed to create delivery" },
        { status: 500 }
      )
    }

    return NextResponse.json({ delivery })
  } catch (error: any) {
    console.error("Error in create delivery API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
