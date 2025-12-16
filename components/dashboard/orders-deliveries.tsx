"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, Truck, Loader2, ExternalLink } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"

interface Order {
  id: string
  created_at: string
  status: string
  fulfillment_status: string
  estimated_delivery_date?: string
  delivery_zipcode?: string
  tracking_url?: string
  tracking_token?: string
  order_number?: string
  recipes: string[]
  total_cents: number
}

export function OrdersDeliveries() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return

      try {
        setIsLoading(true)

        // Fetch orders from database
        const { data: ordersData, error } = await supabase
          .from("orders")
          .select(`
            id,
            created_at,
            status,
            fulfillment_status,
            estimated_delivery_date,
            delivery_zipcode,
            tracking_url,
            tracking_token,
            order_number,
            total_cents,
            recipes,
            plan:plans (
              plan_items (
                recipes (name)
              )
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10)

        if (error) {
          console.error("Error fetching orders:", error)
          return
        }

        // Transform orders to include recipe names
        const transformedOrders = ordersData?.map((order: any) => {
          let recipeNames: string[] = []

          // Get recipes from plan_items if available
          if (order.plan?.plan_items && Array.isArray(order.plan.plan_items)) {
            recipeNames = order.plan.plan_items
              .map((item: any) => item.recipes?.name)
              .filter(Boolean)
          }

          // Fallback to recipes JSON field if no plan items
          if (recipeNames.length === 0 && order.recipes) {
            try {
              const recipesData = Array.isArray(order.recipes) ? order.recipes : JSON.parse(order.recipes)
              recipeNames = recipesData.map((r: any) => r.name || r).filter(Boolean)
            } catch (e) {
              console.error("Error parsing recipes JSON:", e)
            }
          }

          return {
            id: order.id,
            created_at: order.created_at,
            status: order.status,
            fulfillment_status: order.fulfillment_status,
            estimated_delivery_date: order.estimated_delivery_date,
            delivery_zipcode: order.delivery_zipcode,
            tracking_url: order.tracking_url,
            tracking_token: order.tracking_token,
            order_number: order.order_number,
            recipes: recipeNames,
            total_cents: order.total_cents || 0,
          }
        }) || []

        setOrders(transformedOrders)
      } catch (error) {
        console.error("Error in fetchOrders:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [user])

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-green-500 text-white"
      case "out_for_delivery":
      case "out for delivery":
        return "bg-blue-500 text-white"
      case "preparing":
      case "in_stock":
        return "bg-yellow-500 text-white"
      case "pending":
      case "looking_for_driver":
        return "bg-gray-500 text-white"
      case "cancelled":
      case "canceled":
        return "bg-red-500 text-white"
      default:
        return "bg-gray-400 text-white"
    }
  }

  const getStatusLabel = (order: Order) => {
    const status = order.fulfillment_status || order.status
    switch (status?.toLowerCase()) {
      case "delivered":
        return "Delivered"
      case "out_for_delivery":
      case "out for delivery":
        return "Out for Delivery"
      case "preparing":
        return "Preparing"
      case "in_stock":
        return "Ready"
      case "pending":
        return "Pending"
      case "looking_for_driver":
        return "Scheduled"
      case "driver_assigned":
        return "Driver Assigned"
      case "cancelled":
      case "canceled":
        return "Cancelled"
      default:
        return status || "Processing"
    }
  }

  const getEstimatedDelivery = (order: Order) => {
    const status = order.fulfillment_status || order.status
    const activeStatuses = ["preparing", "out_for_delivery", "out for delivery", "driver_assigned"]

    // If order is actively being prepared or delivered, show today
    if (activeStatuses.includes(status?.toLowerCase())) {
      return "Today"
    }

    // Otherwise show the estimated delivery date
    if (order.estimated_delivery_date) {
      return new Date(order.estimated_delivery_date).toLocaleDateString()
    }

    return "TBD"
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Orders & Deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading orders...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Orders & Deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p>No orders yet</p>
            <p className="text-xs mt-1">Your orders and deliveries will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Orders & Deliveries</CardTitle>
          <span className="text-sm text-muted-foreground">{orders.length} orders</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="p-4 border rounded-lg space-y-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex flex-wrap items-center gap-2">
                      {order.order_number && (
                        <span className="font-medium">Order #{order.order_number}</span>
                      )}
                      <Badge className={getStatusColor(order.fulfillment_status || order.status)}>
                        {getStatusLabel(order)}
                      </Badge>
                    </div>
                  </div>

                  {order.recipes.length > 0 ? (
                    <div className="text-sm text-muted-foreground">
                      {order.recipes.join(", ")}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Order details</div>
                  )}

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Ordered: {new Date(order.created_at).toLocaleDateString()}</span>
                    <span>Est. delivery: {getEstimatedDelivery(order)}</span>
                    {order.total_cents > 0 && (
                      <span>${(order.total_cents / 100).toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/orders/${order.id}/track`}>
                    <Truck className="h-3 w-3 mr-1" />
                    Track Delivery
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
