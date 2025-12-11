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
    const { data: driver } = await supabase
      .from('drivers')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!driver) {
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      )
    }

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

    orders?.forEach((order) => {
      const date = order.estimated_delivery_date
      if (!date) return

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

    return NextResponse.json(ordersByDate)
  } catch (error: any) {
    console.error('[DRIVER CALENDAR API] Error:', error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch calendar data" },
      { status: 500 }
    )
  }
}
