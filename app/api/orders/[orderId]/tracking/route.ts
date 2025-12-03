import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/orders/[orderId]/tracking
 * Fetch order details and tracking events
 * Supports both authenticated users and guest access via session_id
 */
export async function GET(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get("session_id")

    const supabase = await createServerSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[TRACKING API] Fetching order:", orderId, "sessionId:", sessionId, "user:", user?.email)

    // Fetch order with user profile
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .eq("id", orderId)
      .single()

    if (orderError) {
      console.error("[TRACKING API] Error fetching order:", orderError)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    console.log("[TRACKING API] Order found:", {
      id: order.id,
      user_id: order.user_id,
      guest_email: order.guest_email,
      fulfillment_status: order.fulfillment_status,
    })

    // Authorization check
    // 1. If user is authenticated and owns the order
    const isOwner = user && order.user_id === user.id

    // 2. If this is a guest order and valid session_id provided
    let isGuestWithValidSession = false
    if (!user && order.guest_email && sessionId) {
      // Verify the session_id matches this order
      const { data: claim } = await supabase
        .from("guest_order_claims")
        .select("*")
        .eq("stripe_session_id", sessionId)
        .eq("order_id", orderId)
        .maybeSingle()

      isGuestWithValidSession = !!claim
      console.log("[TRACKING API] Guest claim found:", !!claim)
    }

    if (!isOwner && !isGuestWithValidSession) {
      console.log("[TRACKING API] Unauthorized access attempt")
      return NextResponse.json(
        { error: "Unauthorized. You do not have access to this order." },
        { status: 401 }
      )
    }

    // Fetch tracking events
    const { data: events, error: eventsError } = await supabase
      .from("delivery_tracking_events")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true })

    if (eventsError) {
      console.error("[TRACKING API] Error fetching events:", eventsError)
      // Don't fail the request if events fail to load
    }

    console.log("[TRACKING API] Found", events?.length || 0, "tracking events")

    // Format the response
    const response = {
      order: {
        id: order.id,
        order_type: order.order_type,
        status: order.status,
        fulfillment_status: order.fulfillment_status,
        total_cents: order.total_cents,
        recipes: order.recipes || [],
        delivery_zipcode: order.delivery_zipcode,
        estimated_delivery_window: order.estimated_delivery_window,
        estimated_delivery_date: order.estimated_delivery_date,
        driver_id: order.driver_id,
        driver_name: order.driver_name,
        driver_phone: order.driver_phone,
        created_at: order.created_at,
        user: order.profiles
          ? {
              name: order.profiles.full_name,
              email: order.profiles.email,
            }
          : null,
      },
      events: events || [],
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error("[TRACKING API] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch order tracking" },
      { status: 500 }
    )
  }
}
