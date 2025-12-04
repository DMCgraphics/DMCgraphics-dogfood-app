import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/orders/claim-guest-orders
 * Claims guest orders and links them to the authenticated user's account
 *
 * This endpoint is called after account creation to automatically link
 * any guest orders (placed before account was created) with the same email
 * to the newly created user account.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || !user.email) {
      console.log("[CLAIM GUEST ORDERS] Unauthorized - no user found")
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      )
    }

    console.log("[CLAIM GUEST ORDERS] Claiming orders for email:", user.email)

    // Find all guest orders with matching email that haven't been claimed yet (case-insensitive)
    const { data: guestOrders, error: fetchError } = await supabase
      .from("orders")
      .select("id, order_number, total_cents, created_at")
      .is("user_id", null)
      .ilike("guest_email", user.email)

    if (fetchError) {
      console.error("[CLAIM GUEST ORDERS] Error fetching guest orders:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch guest orders" },
        { status: 500 }
      )
    }

    if (!guestOrders || guestOrders.length === 0) {
      console.log("[CLAIM GUEST ORDERS] No guest orders found for:", user.email)
      return NextResponse.json({
        success: true,
        claimed: 0,
        message: "No guest orders found to claim",
      })
    }

    console.log(`[CLAIM GUEST ORDERS] Found ${guestOrders.length} guest orders to claim`)

    // Update all matching guest orders to link them to this user
    const orderIds = guestOrders.map((o) => o.id)
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        user_id: user.id,
        updated_at: new Date().toISOString(),
      })
      .in("id", orderIds)

    if (updateError) {
      console.error("[CLAIM GUEST ORDERS] Error updating orders:", updateError)
      return NextResponse.json(
        { error: "Failed to claim guest orders" },
        { status: 500 }
      )
    }

    // Update guest_order_claims table to mark as claimed
    const { error: claimUpdateError } = await supabase
      .from("guest_order_claims")
      .update({
        claimed_at: new Date().toISOString(),
        claimed_by_user_id: user.id,
      })
      .in("order_id", orderIds)

    if (claimUpdateError) {
      console.warn("[CLAIM GUEST ORDERS] Error updating claim records:", claimUpdateError)
      // Don't fail the request if claim table update fails
    }

    console.log(`[CLAIM GUEST ORDERS] Successfully claimed ${guestOrders.length} orders for user:`, user.id)

    return NextResponse.json({
      success: true,
      claimed: guestOrders.length,
      orders: guestOrders.map((o) => ({
        id: o.id,
        order_number: o.order_number,
      })),
      message: `Successfully claimed ${guestOrders.length} order${guestOrders.length > 1 ? 's' : ''}`,
    })
  } catch (error) {
    console.error("[CLAIM GUEST ORDERS] Unexpected error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
