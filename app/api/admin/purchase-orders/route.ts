import { NextRequest, NextResponse } from "next/server"
import { createClient, supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Fetch all purchase orders with vendor and items
    const { data: purchaseOrders, error: poError } = await supabaseAdmin
      .from("purchase_orders")
      .select(`
        *,
        vendors (
          id,
          name,
          contact_email,
          contact_name
        ),
        purchase_order_items (
          id,
          ingredient_name,
          quantity_lbs,
          unit_price_cents,
          total_price_cents,
          notes
        )
      `)
      .order("created_at", { ascending: false })

    if (poError) {
      console.error("Error fetching purchase orders:", poError)
      return NextResponse.json({ error: "Failed to fetch purchase orders" }, { status: 500 })
    }

    return NextResponse.json({ purchaseOrders })
  } catch (error: any) {
    console.error("Error in GET /api/admin/purchase-orders:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
