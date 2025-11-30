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
    const validStatuses = ["scheduled", "preparing", "out_for_delivery", "delivered", "failed", "cancelled"]
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      status,
      driver_id: user.id,
    }

    // Set actual delivery date when marked as delivered
    if (status === "delivered") {
      updateData.actual_delivery_date = new Date().toISOString()
    }

    // Add driver notes if provided
    if (driver_notes !== undefined) {
      updateData.driver_notes = driver_notes
    }

    const { data: delivery, error } = await supabaseAdmin
      .from("deliveries")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        plans (
          id,
          dog_id,
          dogs (name, breed)
        )
      `)
      .single()

    if (error) {
      console.error("Error updating delivery status:", error)
      return NextResponse.json(
        { error: "Failed to update delivery status" },
        { status: 500 }
      )
    }

    if (!delivery) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Delivery marked as ${status}`,
      delivery,
    })
  } catch (error: any) {
    console.error("Error in update delivery status API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
