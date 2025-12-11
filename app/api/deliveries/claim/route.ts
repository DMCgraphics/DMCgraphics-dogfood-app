import { NextResponse } from "next/server"
import { createServerSupabase, supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST - Claim an unassigned delivery
export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a delivery driver or admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("is_admin, roles")
      .eq("id", user.id)
      .single()

    const isDriver = profile?.roles?.includes("delivery_driver")
    const isAdmin = profile?.is_admin || profile?.roles?.includes("admin")

    if (!isDriver && !isAdmin) {
      return NextResponse.json(
        { error: "Only delivery drivers can claim deliveries" },
        { status: 403 }
      )
    }

    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      )
    }

    // Fetch the order to verify it's unassigned
    const { data: order, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("id, driver_id, fulfillment_status")
      .eq("id", orderId)
      .single()

    if (fetchError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    // Check if order is already assigned to another driver
    if (order.driver_id && order.driver_id !== user.id) {
      return NextResponse.json(
        { error: "This order is already assigned to another driver" },
        { status: 409 }
      )
    }

    // If already assigned to this driver, no action needed
    if (order.driver_id === user.id) {
      return NextResponse.json(
        { message: "Order already assigned to you" },
        { status: 200 }
      )
    }

    // Claim the order
    const updateData: any = {
      driver_id: user.id
    }

    // If status is "looking_for_driver", update to "driver_assigned"
    if (order.fulfillment_status === "looking_for_driver") {
      updateData.fulfillment_status = "driver_assigned"
    }

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update(updateData)
      .eq("id", orderId)

    if (updateError) {
      console.error("Error claiming order:", updateError)
      return NextResponse.json(
        { error: "Failed to claim order" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "Order claimed successfully" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error in claim delivery API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
