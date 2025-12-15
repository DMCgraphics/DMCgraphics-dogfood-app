import { NextResponse } from "next/server"
import { createServerSupabase, supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Driver color palette for visual consistency
const DRIVER_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
]

export async function GET(req: Request) {
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
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Get date range from query params (default to current month)
    const url = new URL(req.url)
    const start = url.searchParams.get('start')
    const end = url.searchParams.get('end')

    const today = new Date()
    const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
    const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]

    const startDate = start || defaultStart
    const endDate = end || defaultEnd

    // Use admin client for database operations to bypass RLS
    // Fetch orders in date range with delivery-related statuses
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .gte('estimated_delivery_date', startDate)
      .lte('estimated_delivery_date', endDate)
      .in('fulfillment_status', ['driver_assigned', 'preparing', 'out_for_delivery', 'delivered'])
      .order('estimated_delivery_date', { ascending: true })

    if (error) {
      console.error('[CALENDAR API] Error fetching orders:', error)
      throw error
    }

    // Group orders by date
    const ordersByDate: Record<string, any> = {}
    const driverColorMap: Record<string, string> = {}
    let colorIndex = 0

    orders?.forEach((order) => {
      const date = order.estimated_delivery_date
      if (!date) return

      if (!ordersByDate[date]) {
        ordersByDate[date] = {
          total: 0,
          by_status: {
            driver_assigned: 0,
            preparing: 0,
            out_for_delivery: 0,
            delivered: 0,
          },
          by_driver: {} as Record<string, { driver_id: string, driver_name: string, count: number, color: string }>,
          orders: [],
        }
      }

      // Increment totals
      ordersByDate[date].total++
      if (order.fulfillment_status in ordersByDate[date].by_status) {
        ordersByDate[date].by_status[order.fulfillment_status]++
      }

      // Group by driver
      if (order.driver_id && order.driver_name) {
        // Assign color to driver if not already assigned
        if (!driverColorMap[order.driver_id]) {
          driverColorMap[order.driver_id] = DRIVER_COLORS[colorIndex % DRIVER_COLORS.length]
          colorIndex++
        }

        if (!ordersByDate[date].by_driver[order.driver_id]) {
          ordersByDate[date].by_driver[order.driver_id] = {
            driver_id: order.driver_id,
            driver_name: order.driver_name,
            count: 0,
            color: driverColorMap[order.driver_id],
          }
        }

        ordersByDate[date].by_driver[order.driver_id].count++
      }

      // Add order to list
      ordersByDate[date].orders.push(order)
    })

    // Convert by_driver object to array
    Object.keys(ordersByDate).forEach((date) => {
      ordersByDate[date].by_driver = Object.values(ordersByDate[date].by_driver)
    })

    return NextResponse.json(ordersByDate)
  } catch (error: any) {
    console.error('[CALENDAR API] Error:', error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch calendar data" },
      { status: 500 }
    )
  }
}
