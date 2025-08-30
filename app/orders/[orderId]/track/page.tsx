"use client"

import { useParams, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { OrderTracker } from "@/components/orders/order-tracker"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function TrackOrderPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orderId = params.orderId as string
  const trackingNumber = searchParams.get("tracking")

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container py-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/orders">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Orders
                </Link>
              </Button>
              <div>
                <h1 className="font-manrope text-2xl lg:text-3xl font-bold">Track Your Order</h1>
                <p className="text-muted-foreground">Real-time updates on your delivery</p>
              </div>
            </div>

            <OrderTracker orderId={orderId} trackingNumber={trackingNumber || undefined} />
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  )
}
