"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Package, ArrowRight, Home, Loader2, MapPin } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/header"

interface Order {
  id: string
  order_number: string
  fulfillment_status: string
  estimated_delivery_window?: string
  estimated_delivery_date?: string
}

function ShopSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [isLoading, setIsLoading] = useState(true)
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrder() {
      if (!sessionId) {
        setIsLoading(false)
        return
      }

      try {
        // Fetch order by session ID
        const response = await fetch(`/api/orders/session/${sessionId}`)

        if (response.ok) {
          const data = await response.json()
          setOrder(data.order)
        } else {
          console.warn("Order not found for session:", sessionId)
          // Don't set error - just show generic success page
        }
      } catch (err) {
        console.error("Error fetching order:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [sessionId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Processing your order...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-16 max-w-3xl">
        <div className="text-center mb-8">
          <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-xl text-muted-foreground">
            Thank you for your purchase
          </p>
          {order && (
            <p className="text-sm text-muted-foreground mt-2">
              Order #{order.order_number}
            </p>
          )}
        </div>

        {/* Track Your Order CTA */}
        {order && (
          <Card className="mb-6 border-2 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1">Track Your Delivery</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Follow your order in real-time from our kitchen to your door
                    {order.estimated_delivery_window && (
                      <span className="block mt-1 font-medium text-foreground">
                        Estimated: {order.estimated_delivery_window}
                      </span>
                    )}
                  </p>
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link href={`/orders/${order.id}/track`}>
                      <MapPin className="h-4 w-4 mr-2" />
                      Track Your Order
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              What happens next?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium">Looking for a Driver</p>
                  <p className="text-sm text-muted-foreground">
                    We're finding the best driver in your area for fast delivery
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium">Preparing Your Order</p>
                  <p className="text-sm text-muted-foreground">
                    We'll prepare your fresh food packs with care
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium">Free Local Delivery</p>
                  <p className="text-sm text-muted-foreground">
                    Your order will be delivered fresh to your door
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50 mb-6">
          <CardHeader>
            <CardTitle>Want to save on future orders?</CardTitle>
            <CardDescription>
              Create an account to access subscription plans, manage orders, and get exclusive perks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1" variant="outline">
                <Link href="/auth/signup">
                  Create Account
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/plan-builder">
                  View Subscription Plans
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="ghost" asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

function ShopSuccessLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-16 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    </div>
  )
}

export default function ShopSuccessPage() {
  return (
    <Suspense fallback={<ShopSuccessLoading />}>
      <ShopSuccessContent />
    </Suspense>
  )
}
