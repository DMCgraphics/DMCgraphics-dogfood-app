import { NextResponse } from "next/server"
import { createServerSupabase, supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET - Fetch all deliveries for drivers
export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a delivery driver or admin
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin, roles")
      .eq("id", user.id)
      .single()

    const isDriver = profile?.roles?.includes("delivery_driver")
    const isAdmin = profile?.is_admin || profile?.roles?.includes("admin")

    if (!isDriver && !isAdmin) {
      return NextResponse.json(
        { error: "Only delivery drivers can access this endpoint" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const date = searchParams.get("date") // YYYY-MM-DD format

    let query = supabaseAdmin
      .from("deliveries")
      .select(`
        *,
        plans (
          id,
          dog_id,
          delivery_zipcode,
          dogs (name, breed),
          plan_items (
            id,
            qty,
            size_g,
            recipes (name, slug)
          )
        )
      `)
      .order("scheduled_date", { ascending: true })

    // Filter by status
    if (status) {
      if (status === "pending") {
        // Pending means scheduled, preparing, or out_for_delivery
        query = query.in("status", ["scheduled", "preparing", "out_for_delivery"])
      } else {
        query = query.eq("status", status)
      }
    }

    // Filter by date
    if (date) {
      query = query.eq("scheduled_date", date)
    }

    const { data: deliveries, error } = await query

    if (error) {
      console.error("Error fetching driver deliveries:", error)
      return NextResponse.json(
        { error: "Failed to fetch deliveries" },
        { status: 500 }
      )
    }

    return NextResponse.json({ deliveries })
  } catch (error: any) {
    console.error("Error in driver deliveries API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
