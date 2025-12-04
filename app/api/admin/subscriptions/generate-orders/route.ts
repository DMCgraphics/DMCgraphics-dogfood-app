import { NextResponse } from "next/server"
import { supabaseAdmin, createServerSupabase } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Generate subscription orders for a specific delivery date
 * This can be called manually or via a cron job
 */
export async function POST(req: Request) {
  try {
    // Check if user is admin
    const supabase = createServerSupabase()
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
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { deliveryDate } = body

    // Default to today if no date provided
    const targetDate = deliveryDate ? new Date(deliveryDate) : new Date()
    targetDate.setHours(0, 0, 0, 0)

    console.log('[generate-orders] Generating orders for date:', targetDate.toISOString())

    // Find all active subscriptions where current_period_end is today or in the past
    const { data: subscriptions, error: subsError } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        id,
        user_id,
        stripe_subscription_id,
        current_period_end,
        interval,
        interval_count,
        plan_id,
        plans (
          id,
          snapshot,
          delivery_zipcode
        )
      `)
      .eq('status', 'active')
      .lte('current_period_end', targetDate.toISOString())

    if (subsError) {
      console.error('[generate-orders] Error fetching subscriptions:', subsError)
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No subscriptions due for delivery",
        created: 0,
        failed: 0
      })
    }

    console.log(`[generate-orders] Found ${subscriptions.length} subscriptions due for delivery`)

    const results = {
      created: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Generate an order for each subscription
    for (const subscription of subscriptions) {
      try {
        // Check if order already exists for this subscription and date
        const { data: existingOrder } = await supabaseAdmin
          .from('orders')
          .select('id')
          .eq('user_id', subscription.user_id)
          .eq('is_subscription_order', true)
          .eq('estimated_delivery_date', targetDate.toISOString().split('T')[0])
          .single()

        if (existingOrder) {
          console.log(`[generate-orders] Order already exists for subscription ${subscription.id}`)
          continue
        }

        // Get plan details and recipes
        const plan = subscription.plans as any
        const snapshot = plan?.snapshot || {}
        const recipes = snapshot.recipes || []
        const recipeName = recipes.length > 0
          ? recipes.map((r: any) => r.name).join(', ')
          : 'Fresh Food Pack'

        // Calculate total quantity
        const quantity = recipes.reduce((sum: number, r: any) => sum + (r.quantity || 1), 0)

        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

        // Create the order
        const orderData = {
          user_id: subscription.user_id,
          order_number: orderNumber,
          order_type: 'subscription',
          status: 'paid',
          fulfillment_status: 'looking_for_driver',
          delivery_method: 'local_delivery',
          delivery_zipcode: plan?.delivery_zipcode || '06902',
          estimated_delivery_date: targetDate.toISOString().split('T')[0],
          estimated_delivery_window: '9:00 AM - 5:00 PM',
          total: snapshot.total_cents ? snapshot.total_cents / 100 : 50.00,
          total_cents: snapshot.total_cents || 5000,
          recipes: recipes,
          recipe_name: recipeName,
          quantity: quantity || 14,
          is_subscription_order: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { data: order, error: orderError } = await supabaseAdmin
          .from('orders')
          .insert(orderData)
          .select()
          .single()

        if (orderError) {
          console.error('[generate-orders] Error creating order:', orderError)
          results.failed++
          results.errors.push(`Failed to create order for subscription ${subscription.id}: ${orderError.message}`)
          continue
        }

        // Create initial tracking event
        await supabaseAdmin.from('delivery_tracking_events').insert({
          order_id: order.id,
          event_type: 'looking_for_driver',
          description: 'Subscription order received. Looking for an available driver in your area.',
          metadata: {
            subscription_id: subscription.id,
            stripe_subscription_id: subscription.stripe_subscription_id,
          },
          created_at: new Date().toISOString(),
        })

        console.log(`[generate-orders] Created order ${order.order_number} for subscription ${subscription.id}`)
        results.created++

      } catch (error: any) {
        console.error('[generate-orders] Error processing subscription:', error)
        results.failed++
        results.errors.push(`Error processing subscription ${subscription.id}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${results.created} orders. ${results.failed} failed.`,
      created: results.created,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined
    })

  } catch (error: any) {
    console.error('[generate-orders] Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || "Failed to generate orders" },
      { status: 500 }
    )
  }
}
