import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/orders/[orderId]/tracking
 * Fetch order details and tracking events
 * Supports:
 * - Authenticated users (via auth)
 * - Guest access via session_id
 * - Public access via tracking_token (for shareable links)
 */
export async function GET(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get("session_id")
    const token = searchParams.get("token")

    const supabase = await createServerSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[TRACKING API] Fetching order:", orderId, "sessionId:", sessionId, "token:", !!token, "user:", user?.email)

    // Fetch order (without profile join to avoid RLS issues)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
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

    // Authorization check - multiple valid paths
    // 1. If valid tracking token provided (for shareable links - works for everyone)
    const hasValidToken = token && order.tracking_token === token

    // 2. If user is authenticated and owns the order
    const isOwner = user && order.user_id === user.id

    // 3. If user is authenticated and email matches guest_email (handles claimed orders)
    const isGuestEmailMatch = user && order.guest_email && order.guest_email === user.email

    // 4. If this is a guest order and valid session_id provided
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

    console.log("[TRACKING API] Access methods:", {
      token: hasValidToken,
      owner: isOwner,
      guestEmail: isGuestEmailMatch,
      session: isGuestWithValidSession
    })

    // Allow access if ANY authorization method succeeds
    if (!hasValidToken && !isOwner && !isGuestEmailMatch && !isGuestWithValidSession) {
      console.log("[TRACKING API] Unauthorized access attempt")
      return NextResponse.json(
        { error: "Unauthorized. You do not have access to this order." },
        { status: 401 }
      )
    }

    // Fetch order items with recipe details
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select(`
        id,
        quantity,
        price,
        recipes (
          id,
          name,
          slug
        )
      `)
      .eq("order_id", orderId)

    if (itemsError) {
      console.error("[TRACKING API] Error fetching order items:", itemsError)
    }

    // Format recipes from order_items
    const recipes = orderItems?.map(item => ({
      id: item.recipes?.id,
      name: item.recipes?.name,
      slug: item.recipes?.slug,
      quantity: item.quantity
    })) || []

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
        recipes: recipes,
        delivery_zipcode: order.delivery_zipcode,
        estimated_delivery_window: order.estimated_delivery_window,
        estimated_delivery_date: order.estimated_delivery_date,
        driver_id: order.driver_id,
        driver_name: order.driver_name,
        driver_phone: order.driver_phone,
        created_at: order.created_at,
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
