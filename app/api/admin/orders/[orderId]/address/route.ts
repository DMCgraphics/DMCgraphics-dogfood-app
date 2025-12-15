import { NextResponse } from "next/server"
import { createServerSupabase, supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Use regular client for authentication
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }

    const { orderId } = await params
    const body = await req.json()

    const {
      customer_name,
      delivery_address_line1,
      delivery_address_line2,
      delivery_city,
      delivery_state,
      delivery_zipcode,
    } = body

    // Validate required fields
    if (!delivery_address_line1 || !delivery_zipcode) {
      return NextResponse.json(
        { error: "Address line 1 and ZIP code are required" },
        { status: 400 }
      )
    }

    // Use admin client for database operations to bypass RLS
    // Try to update orders table first
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .update({
        customer_name,
        delivery_address_line1,
        delivery_address_line2,
        delivery_city,
        delivery_state,
        delivery_zipcode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .maybeSingle()

    // If found in orders table, return success
    if (orderData) {
      return NextResponse.json({
        success: true,
        order: orderData,
      })
    }

    // If not found in orders, try subscriptions table (for topper subscriptions)
    const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        customer_name,
        delivery_address_line1,
        delivery_address_line2,
        delivery_city,
        delivery_state,
        delivery_zipcode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .maybeSingle()

    // If found in subscriptions table, return success
    if (subscriptionData) {
      return NextResponse.json({
        success: true,
        order: subscriptionData,
      })
    }

    // If not found in subscriptions, try plans table (for plan-based subscriptions)
    const { data: planData, error: planError } = await supabaseAdmin
      .from('plans')
      .update({
        customer_name,
        delivery_address_line1,
        delivery_address_line2,
        delivery_city,
        delivery_state,
        delivery_zipcode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .maybeSingle()

    // If found in plans table, return success
    if (planData) {
      return NextResponse.json({
        success: true,
        order: planData,
      })
    }

    // If not found in any table, return error
    const error = planError || subscriptionError || orderError
    console.error('[ADDRESS UPDATE API] Error updating address:', error)
    throw new Error('Order, subscription, or plan not found')
  } catch (error: any) {
    console.error('[ADDRESS UPDATE API] Error:', error)
    return NextResponse.json(
      { error: error.message || "Failed to update address" },
      { status: 500 }
    )
  }
}
