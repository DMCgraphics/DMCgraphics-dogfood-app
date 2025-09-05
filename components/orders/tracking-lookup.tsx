"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Package } from "lucide-react"
import { useRouter } from "next/navigation"

export function TrackingLookup() {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [orderNumber, setOrderNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleTrack = async () => {
    if (!trackingNumber && !orderNumber) {
      setError("Please enter either a tracking number or order number")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // In real app, this would validate the tracking/order number
      const searchParam = trackingNumber || orderNumber

      if (orderNumber) {
        router.push(`/orders/${orderNumber}/track`)
      } else {
        // Find order by tracking number
        router.push(`/orders/ORD-2024-001/track?tracking=${trackingNumber}`)
      }

      console.log("[v0] tracking_lookup", { trackingNumber, orderNumber })
    } catch (err: any) {
      setError("Unable to find order. Please check your tracking or order number.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
          <Package className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Track Your Order</CardTitle>
        <p className="text-muted-foreground text-sm">
          Enter your tracking number or order number to get real-time updates
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="tracking">Tracking Number</Label>
          <Input
            id="tracking"
            placeholder="e.g., 1Z999AA1234567890"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />
        </div>

        <div className="text-center text-sm text-muted-foreground">or</div>

        <div className="space-y-2">
          <Label htmlFor="order">Order Number</Label>
          <Input
            id="order"
            placeholder="e.g., ORD-2024-001"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
          />
        </div>

        <Button onClick={handleTrack} className="w-full" disabled={isLoading}>
          {isLoading ? (
            "Searching..."
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Track Order
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground text-center">
          Don't have your tracking number?{" "}
          <a href="/orders" className="text-primary hover:underline">
            View your orders
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
