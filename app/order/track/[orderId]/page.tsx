"use client"

import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { OrderTrackingTimeline } from "@/components/order-tracking-timeline"
import { DriverInfoCard } from "@/components/driver-info-card"
import { useOrderTracking } from "@/hooks/use-order-tracking"
import { Loader2, Package, ArrowLeft, Calendar, MapPin } from "lucide-react"
import Link from "next/link"

interface OrderTrackingPageProps {
  params: {
    orderId: string
  }
}

export default function OrderTrackingPage({ params }: OrderTrackingPageProps) {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")

  const { order, events, isConnected, isLoading, error } = useOrderTracking(
    params.orderId,
    sessionId
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Loading order details...</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 text-center">
              <Package className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2 text-red-600">Error Loading Order</h3>
              <p className="text-red-600/80 mb-4">{error}</p>
              <Button asChild variant="outline">
                <Link href="/orders">View All Orders</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Order Not Found</h3>
              <p className="text-muted-foreground mb-4">
                We couldn't find this order. Please check the link and try again.
              </p>
              <Button asChild>
                <Link href="/orders">View All Orders</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  const recipes = order.recipes || []
  const recipesText =
    recipes.length > 0
      ? recipes.map((r: any) => r.name).join(", ")
      : "Fresh Food Pack"

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="gap-2">
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Link>
          </Button>
        </div>

        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Order Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl font-manrope">Track Your Order</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Order placed on{" "}
                    {new Date(order.created_at).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    ${(order.total_cents / 100).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order items */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Items
                </h4>
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-sm">{recipesText}</p>
                </div>
              </div>

              {/* Delivery info */}
              {order.delivery_zipcode && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Delivery Location
                  </h4>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-sm">ZIP Code: {order.delivery_zipcode}</p>
                  </div>
                </div>
              )}

              {/* Delivery date - show actual delivery time if delivered, otherwise estimated */}
              {(order.delivered_at || order.estimated_delivery_date) && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {order.fulfillment_status === 'delivered' && order.delivered_at ? 'Delivered' : 'Estimated Delivery'}
                  </h4>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    {order.fulfillment_status === 'delivered' && order.delivered_at ? (
                      <p className="text-sm">
                        {new Date(order.delivered_at).toLocaleString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    ) : (
                      <p className="text-sm">
                        {new Date(order.estimated_delivery_date).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                        {order.estimated_delivery_window && (
                          <span className="ml-2 text-muted-foreground">
                            {order.estimated_delivery_window}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Driver info card - only show if driver assigned and not yet delivered */}
          {order.driver_id && order.driver_name && order.fulfillment_status !== 'delivered' && (
            <DriverInfoCard
              driverName={order.driver_name}
              driverPhone={order.driver_phone}
              estimatedWindow={order.estimated_delivery_window}
            />
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Status</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTrackingTimeline
                currentStatus={order.fulfillment_status}
                events={events}
                isLive={isConnected}
              />
            </CardContent>
          </Card>

          {/* Help section */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2">Need Help?</h4>
              <p className="text-sm text-muted-foreground mb-4">
                If you have any questions about your order, please don't hesitate to reach out.
              </p>
              <Button variant="outline" asChild>
                <Link href="/contact">Contact Support</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
