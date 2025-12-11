import { NextResponse } from "next/server"
import { createServerSupabase, supabaseAdmin } from "@/lib/supabase/server"
import { calculateStopDistance } from "@/lib/utils/route-distance"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET - Fetch all deliveries for drivers
export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a delivery driver or admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("is_admin, roles")
      .eq("id", user.id)
      .single()

    const isDriver = profile?.roles?.includes("delivery_driver")
    const isAdmin = profile?.is_admin || profile?.roles?.includes("admin")

    if (!isDriver && !isAdmin) {
      return NextResponse.json(
        { error: "Only delivery drivers can access this endpoint" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const date = searchParams.get("date") // YYYY-MM-DD format

    // First, fetch orders for this driver (assigned to them OR unassigned)
    let allOrdersQuery = supabaseAdmin
      .from("orders")
      .select(`
        *
      `)
      .or(`driver_id.eq.${user.id},driver_id.is.null`)
      .order("estimated_delivery_date", { ascending: true })

    // Filter by date if specified
    if (date) {
      allOrdersQuery = allOrdersQuery.eq("estimated_delivery_date", date)
    }

    const { data: allOrders, error: allOrdersError } = await allOrdersQuery

    if (allOrdersError) {
      console.error("Error fetching all driver deliveries:", allOrdersError)
      return NextResponse.json(
        { error: "Failed to fetch deliveries" },
        { status: 500 }
      )
    }

    if (!allOrders || allOrders.length === 0) {
      return NextResponse.json({
        deliveries: [],
        route_meta: {
          total_stops: 0,
          completed_stops: 0,
          current_stop_index: 0,
          driver_zipcode: null
        }
      })
    }

    // Calculate completed stops from ALL orders
    const completedStops = allOrders.filter(d => d.fulfillment_status === "delivered").length

    // Separate active orders from completed/cancelled/failed
    const activeOrders = allOrders.filter(
      d => d.fulfillment_status !== "delivered" && d.fulfillment_status !== "cancelled" && d.fulfillment_status !== "failed"
    )
    const completedOrders = allOrders.filter(
      d => d.fulfillment_status === "delivered" || d.fulfillment_status === "cancelled" || d.fulfillment_status === "failed"
    )

    const driverZipcode = activeOrders[0]?.delivery_zipcode || "00000"

    // Check if we need to calculate and save route positions
    // Only calculate if orders don't have route_position set yet
    const needsRouteCalculation = activeOrders.some(order => order.route_position == null)

    let sortedActiveOrders = [...activeOrders]

    if (needsRouteCalculation) {
      // Calculate the route for orders without positions
      // Separate orders with manual route positions from auto-routed ones
      const manualRouteOrders = sortedActiveOrders.filter(d => d.route_override && d.route_position != null)
      const autoRouteOrders = sortedActiveOrders.filter(d => !d.route_override || d.route_position == null)

      // Sort manual route orders by route_position
      manualRouteOrders.sort((a, b) => (a.route_position || 0) - (b.route_position || 0))

      // Auto-route the rest by zipcode distance (traveling salesman heuristic)
      if (autoRouteOrders.length > 0) {
        const routed: typeof autoRouteOrders = []
        let currentZip = driverZipcode
        const remaining = [...autoRouteOrders]

        while (remaining.length > 0) {
          // Find nearest unvisited stop
          let nearestIndex = 0
          let nearestDistance = Infinity

          for (let i = 0; i < remaining.length; i++) {
            const distance = calculateStopDistance(currentZip, remaining[i].delivery_zipcode || "00000").distanceScore
            if (distance < nearestDistance) {
              nearestDistance = distance
              nearestIndex = i
            }
          }

          const nearest = remaining.splice(nearestIndex, 1)[0]
          routed.push(nearest)
          currentZip = nearest.delivery_zipcode || currentZip
        }

        sortedActiveOrders = [...manualRouteOrders, ...routed]
      } else {
        sortedActiveOrders = manualRouteOrders
      }

      // Save route positions to database for stability
      const updates = sortedActiveOrders.map((order, index) => ({
        id: order.id,
        route_position: completedStops + index + 1
      }))

      // Update all orders with their route positions
      for (const update of updates) {
        await supabaseAdmin
          .from("orders")
          .update({ route_position: update.route_position })
          .eq("id", update.id)
      }
    } else {
      // Use existing route positions - sort by route_position
      sortedActiveOrders.sort((a, b) => (a.route_position || 0) - (b.route_position || 0))
    }

    // Calculate distances between consecutive stops for ACTIVE orders
    // Use route_position as stop_number (already includes completed stops offset)
    const activeOrdersWithDistance = sortedActiveOrders.map((delivery, index) => {
      const fromZip = index === 0 ? driverZipcode : sortedActiveOrders[index - 1].delivery_zipcode || driverZipcode
      const toZip = delivery.delivery_zipcode || "00000"
      const distanceInfo = calculateStopDistance(fromZip, toZip)

      return {
        ...delivery,
        stop_number: delivery.route_position || (completedStops + index + 1),
        distance_from_previous: distanceInfo.distance,
        eta_from_previous: distanceInfo.eta,
        distance_score: distanceInfo.distanceScore
      }
    })

    // Add completed orders with their saved route_position as stop_number
    // Sort completed orders by route_position to maintain order
    const sortedCompletedOrders = [...completedOrders].sort((a, b) =>
      (a.route_position || 0) - (b.route_position || 0)
    )
    const completedOrdersWithDistance = sortedCompletedOrders.map((delivery) => ({
      ...delivery,
      stop_number: delivery.route_position || 0,
      distance_from_previous: "Completed",
      eta_from_previous: "",
      distance_score: 0
    }))

    // Combine all orders (completed + active) for full route view
    const allOrdersWithDistance = [...completedOrdersWithDistance, ...activeOrdersWithDistance]

    // Filter deliveries based on status for display
    let deliveriesWithDistance = allOrdersWithDistance
    if (status) {
      if (status === "pending") {
        // Pending means all active statuses: pending, preparing, or out_for_delivery
        deliveriesWithDistance = activeOrdersWithDistance
      } else if (status === "delivered") {
        deliveriesWithDistance = completedOrdersWithDistance
      } else {
        deliveriesWithDistance = allOrdersWithDistance.filter(d => d.fulfillment_status === status)
      }
    }

    // Calculate route metadata
    const totalStops = allOrdersWithDistance.length
    const currentStopIndex = 0  // First active order is always the current stop

    const route_meta = {
      total_stops: totalStops,
      completed_stops: completedStops,
      current_stop_index: currentStopIndex === -1 ? allOrdersWithDistance.length : currentStopIndex,
      driver_zipcode: driverZipcode
    }

    return NextResponse.json({
      deliveries: deliveriesWithDistance,
      route_meta
    })
  } catch (error: any) {
    console.error("Error in driver deliveries API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
