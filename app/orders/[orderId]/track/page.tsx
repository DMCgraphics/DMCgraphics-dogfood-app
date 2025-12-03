"use client"

import { useParams, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { OrderTrackingTimeline } from "@/components/order-tracking-timeline"
import { DriverInfoCard } from "@/components/driver-info-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, Phone, Mail, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useOrderTracking } from "@/hooks/use-order-tracking"
import { useAuth } from "@/contexts/auth-context"

export default function TrackOrderPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orderId = params.orderId as string
  const sessionId = searchParams.get("session_id")
  const token = searchParams.get("token")
  const { isAuthenticated } = useAuth()

  const { order, events, isConnected, isLoading, error } = useOrderTracking(orderId, sessionId)

  return (
    <div className="min-h-screen bg-background">
      <Header />

        <main className="container py-8 max-w-4xl">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/orders">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Orders
                </Link>
              </Button>
              <div className="flex-1">
                <h1 className="font-manrope text-2xl lg:text-3xl font-bold">Track Your Order</h1>
                <p className="text-muted-foreground">Real-time updates on your delivery</p>
              </div>
              {isConnected && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <span className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                  Live
                </Badge>
              )}
            </div>

            {/* Loading State */}
            {isLoading && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                  <p className="text-muted-foreground">Loading order details...</p>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 text-red-600">
                    <AlertCircle className="h-8 w-8" />
                    <div>
                      <h3 className="font-semibold text-lg">Unable to Load Order</h3>
                      <p className="text-sm text-red-600/80">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Content */}
            {order && !isLoading && (
              <>
                {/* Order Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Order ID</p>
                        <p className="font-mono text-sm">{order.id.slice(0, 8)}...</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="font-semibold">${(order.total_cents / 100).toFixed(2)}</p>
                      </div>
                    </div>

                    {(order.estimated_delivery_date || order.estimated_delivery_window) && (
                      <div>
                        <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                        <p className="font-semibold">
                          {order.estimated_delivery_date &&
                            `${new Date(order.estimated_delivery_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric'
                            })}`}
                          {order.estimated_delivery_date && order.estimated_delivery_window && ' • '}
                          {order.estimated_delivery_window}
                        </p>
                      </div>
                    )}

                    {order.recipes && order.recipes.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Items</p>
                        <div className="space-y-1">
                          {order.recipes.map((recipe: any, index: number) => (
                            <div key={index} className="text-sm">
                              {recipe.name} × {recipe.quantity || 1}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tracking Timeline */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Delivery Progress</h2>
                  <OrderTrackingTimeline
                    currentStatus={order.fulfillment_status}
                    events={events}
                    isLive={isConnected}
                  />
                </div>

                {/* Driver Info */}
                {order.driver_name && (
                  <DriverInfoCard
                    driverName={order.driver_name}
                    driverPhone={order.driver_phone}
                    estimatedWindow={order.estimated_delivery_window}
                  />
                )}

                {/* Support Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Need Help?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      If you have any questions about your order, feel free to reach out:
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <a href="tel:+15551234567">
                          <Phone className="h-4 w-4 mr-2" />
                          Call Support
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <a href="mailto:support@nouripet.com">
                          <Mail className="h-4 w-4 mr-2" />
                          Email Us
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>

        <Footer />
      </div>
  )
}
