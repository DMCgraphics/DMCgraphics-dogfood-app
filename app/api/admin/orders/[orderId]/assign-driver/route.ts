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
  try {
    const { orderId } = await params
    console.log('[ASSIGN_DRIVER] Starting assignment, orderId:', orderId)

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
    console.log('[ASSIGN_DRIVER] Driver ID:', driver_id)

    if (!driver_id) {
      return NextResponse.json({ error: "driver_id is required" }, { status: 400 })
    }

    // Get driver details
    const { data: driver, error: driverError } = await supabaseAdmin
      .from("drivers")
      .select("*")
      .eq("id", driver_id)
      .single()

    if (driverError) {
      console.error('[ASSIGN_DRIVER] Driver fetch error:', driverError)
      return NextResponse.json({ error: "Driver not found", details: driverError.message }, { status: 404 })
    }

    if (!driver) {
      console.error('[ASSIGN_DRIVER] Driver not found')
      return NextResponse.json({ error: "Driver not found" }, { status: 404 })
    }

    console.log('[ASSIGN_DRIVER] Driver found:', driver.name)

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
      console.error("[ASSIGN_DRIVER] Database error:", JSON.stringify(error, null, 2))
      return NextResponse.json({
        error: "Failed to assign driver",
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    console.log('[ASSIGN_DRIVER] Success!')
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[ASSIGN_DRIVER] Unexpected error:', error)
    return NextResponse.json({
      error: "Internal server error",
      details: error.message
    }, { status: 500 })
  }
}
