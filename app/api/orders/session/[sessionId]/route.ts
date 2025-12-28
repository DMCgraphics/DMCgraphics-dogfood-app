import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/orders/session/[sessionId]
 * Fetch order details by Stripe session ID
 * Used on success page to get order info immediately after checkout
 */
export async function GET(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params

    console.log("[ORDER BY SESSION] Fetching order for session:", sessionId)

    const supabase = await createServerSupabase()

    // Fetch order by stripe_session_id
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, order_type, delivery_method, fulfillment_status, estimated_delivery_window, estimated_delivery_date, total_cents, recipes")
      .eq("stripe_session_id", sessionId)
      .single()

    if (orderError) {
      console.error("[ORDER BY SESSION] Error fetching order:", orderError)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    console.log("[ORDER BY SESSION] Order found:", order.id)

    return NextResponse.json({
      order,
    })
  } catch (error: any) {
    console.error("[ORDER BY SESSION] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch order" },
      { status: 500 }
    )
  }
}
