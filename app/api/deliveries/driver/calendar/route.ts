import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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

    // Get driver ID from drivers table
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    console.log('[DRIVER CALENDAR API] Driver lookup:', { user_id: user.id, driver, error: driverError })

    if (!driver) {
      console.error('[DRIVER CALENDAR API] Driver not found for user:', user.id)
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      )
    }

    console.log('[DRIVER CALENDAR API] Querying orders for driver:', driver.id, 'between', startDate, 'and', endDate)

    // Fetch driver's assigned orders in date range
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('driver_id', driver.id)
      .gte('estimated_delivery_date', startDate)
      .lte('estimated_delivery_date', endDate)
      .order('estimated_delivery_date', { ascending: true })
      .order('route_position', { ascending: true })

    if (error) {
      console.error('[DRIVER CALENDAR API] Error fetching orders:', error)
      throw error
    }

    // Group orders by date
    const ordersByDate: Record<string, any> = {}

    console.log('[DRIVER CALENDAR API] Found orders:', orders?.length || 0)

    orders?.forEach((order) => {
      const date = order.estimated_delivery_date
      if (!date) return

      console.log('[DRIVER CALENDAR API] Processing order:', order.id, 'for date:', date)

      if (!ordersByDate[date]) {
        ordersByDate[date] = {
          total: 0,
          completed: 0,
          pending: 0,
          orders: [],
        }
      }

      ordersByDate[date].total++

      if (order.fulfillment_status === 'delivered') {
        ordersByDate[date].completed++
      } else {
        ordersByDate[date].pending++
      }

      ordersByDate[date].orders.push(order)
    })

    console.log('[DRIVER CALENDAR API] Grouped orders by date:', JSON.stringify(ordersByDate, null, 2))

    return NextResponse.json(ordersByDate)
  } catch (error: any) {
    console.error('[DRIVER CALENDAR API] Error:', error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch calendar data" },
      { status: 500 }
    )
  }
}
