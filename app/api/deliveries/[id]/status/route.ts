import { NextResponse } from "next/server"
import { createServerSupabase, supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// PATCH - Update delivery status (for drivers)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: "Only delivery drivers can update delivery status" },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await req.json()
    const { status, driver_notes } = body

    // Validate status
    const validStatuses = ["pending", "preparing", "out_for_delivery", "delivered", "failed", "cancelled"]
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      fulfillment_status: status,
      driver_id: user.id,
    }

    // Set delivered_at when marked as delivered
    if (status === "delivered") {
      updateData.delivered_at = new Date().toISOString()
    }

    // Add driver notes if provided (we don't have this field in orders, but keep for compatibility)
    if (driver_notes !== undefined) {
      updateData.route_notes = driver_notes
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single()

    if (error) {
      console.error("Error updating order status:", error)
      return NextResponse.json(
        { error: "Failed to update order status" },
        { status: 500 }
      )
    }

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Order marked as ${status}`,
      delivery: order,
    })
  } catch (error: any) {
    console.error("Error in update delivery status API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
