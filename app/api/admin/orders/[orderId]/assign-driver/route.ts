import { createClient, supabaseAdmin } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * PATCH /api/admin/orders/[orderId]/assign-driver
 * Assign a driver to an order (admin only)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  const supabase = await createClient()

  // Check admin access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("is_admin, roles")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin && !profile?.roles?.includes('admin')) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { driver_id } = body

  if (!driver_id) {
    return NextResponse.json({ error: "driver_id is required" }, { status: 400 })
  }

  // Get driver details
  const { data: driver, error: driverError } = await supabaseAdmin
    .from("drivers")
    .select("*")
    .eq("id", driver_id)
    .single()

  if (driverError || !driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 })
  }

  // Update order with driver info
  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({
      fulfillment_status: 'driver_assigned',
      driver_id: driver_id,
      driver_name: driver.name,
      driver_phone: driver.phone || null,
      driver_home_zipcode: driver.home_zipcode,
    })
    .eq("id", orderId)
    .select()
    .single()

  if (error) {
    console.error("Error assigning driver to order:", error)
    return NextResponse.json({ error: "Failed to assign driver" }, { status: 500 })
  }

  return NextResponse.json(data)
}
