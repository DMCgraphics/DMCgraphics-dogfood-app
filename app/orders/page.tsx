"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Package, Calendar, DollarSign, Truck, CheckCircle, Clock } from "lucide-react"

interface Order {
  id: string
  date: string
  status: "delivered" | "shipped" | "processing" | "cancelled"
  total: number
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  trackingNumber?: string
  estimatedDelivery?: string
  fulfillmentStatus?: string
  hasTracking?: boolean
  driverName?: string
  estimatedDeliveryWindow?: string
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrders() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        console.log("[ORDERS] Fetching orders for user:", user.email)
        const response = await fetch("/api/orders")

        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.statusText}`)
        }

        const data = await response.json()
        console.log("[ORDERS] Received orders:", data)
        setOrders(data.orders || [])
      } catch (error) {
        console.error("[ORDERS] Error fetching orders:", error)
        setError(error instanceof Error ? error.message : "Failed to load orders")
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user])

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "shipped":
        return <Truck className="h-4 w-4 text-blue-500" />
      case "processing":
        return <Clock className="h-4 w-4 text-amber-500" />
      case "cancelled":
        return <Clock className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      case "shipped":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
      case "processing":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
    }
  }

  const handleTrackOrder = (trackingNumber: string) => {
    console.log("[v0] track_order_clicked", { trackingNumber })
    alert(`Track order with number: ${trackingNumber}`)
  }

  const handleReorder = (orderId: string) => {
    console.log("[v0] reorder_clicked", { orderId })
    alert(`Reorder functionality for order: ${orderId}`)
  }

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container py-8">
          <div className="space-y-6">
            <div>
              <h1 className="font-manrope text-2xl lg:text-3xl font-bold">Order History</h1>
              <p className="text-muted-foreground">Track your orders and manage deliveries</p>
            </div>

            {loading ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                  <p className="text-muted-foreground">Loading your orders...</p>
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2 text-red-600">Error Loading Orders</h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button onClick={() => window.location.reload()}>Try Again</Button>
                </CardContent>
              </Card>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No orders yet</h3>
                  <p className="text-muted-foreground mb-4">Start your dog's nutrition journey today!</p>
                  <Button asChild>
                    <a href="/plan-builder">Build Your Plan</a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">Order {order.id}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(order.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />${order.total.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Order Items */}
                      <div className="space-y-2">
                        <h4 className="font-semibold">Items</h4>
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>
                              {item.name} × {item.quantity}
                            </span>
                            <span>${item.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Tracking Information */}
                      {order.hasTracking && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="text-sm font-medium">Delivery Tracking</div>
                              {order.driverName && (
                                <div className="text-sm text-muted-foreground">Driver: {order.driverName}</div>
                              )}
                              {order.estimatedDeliveryWindow && (
                                <div className="text-xs text-muted-foreground">
                                  Estimated: {order.estimatedDeliveryWindow}
                                </div>
                              )}
                              {!order.estimatedDeliveryWindow && order.estimatedDelivery && (
                                <div className="text-xs text-muted-foreground">
                                  Estimated delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            <Button variant="default" size="sm" asChild>
                              <a href={`/orders/${order.id}/track`}>View Tracking</a>
                            </Button>
                          </div>
                        </div>
                      )}
                      {order.trackingNumber && !order.hasTracking && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">Tracking Number</div>
                              <div className="text-sm text-muted-foreground">{order.trackingNumber}</div>
                              {order.estimatedDelivery && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Estimated delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            <Button variant="outline" size="sm" onClick={() => handleTrackOrder(order.trackingNumber!)}>
                              Track Package
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => handleReorder(order.id)}>
                          Reorder
                        </Button>
                        {order.status === "delivered" && (
                          <Button variant="outline" size="sm">
                            Leave Review
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  )
}
