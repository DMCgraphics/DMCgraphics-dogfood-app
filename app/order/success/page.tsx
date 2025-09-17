"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle, Package, Calendar } from "lucide-react"
import Link from "next/link"

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [orderData, setOrderData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const handleSuccessfulPayment = async () => {
      if (!sessionId) return

      try {
        console.log("[v0] Processing successful payment for session:", sessionId)

        // First, verify the session and update plan status
        const verifyResponse = await fetch("/api/verify-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
        })

        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json()
          setOrderData(verifyData)
          console.log("[v0] Payment verified successfully:", verifyData)

          // As a backup, also try to create the subscription directly
          // This ensures the subscription is saved even if the webhook failed
          try {
            const createResponse = await fetch("/api/subscriptions/create", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ sessionId }),
            })

            if (createResponse.ok) {
              const createData = await createResponse.json()
              console.log("[v0] Subscription creation backup successful:", createData)
            } else {
              const errorData = await createResponse.json()
              console.log("[v0] Subscription creation backup failed (this is OK if webhook already handled it):", errorData)
            }
          } catch (createError) {
            console.log("[v0] Subscription creation backup error (this is OK if webhook already handled it):", createError)
          }
        } else {
          console.error("Failed to verify payment:", await verifyResponse.text())
        }
      } catch (error) {
        console.error("Error verifying payment:", error)
      } finally {
        setIsLoading(false)
      }
    }

    handleSuccessfulPayment()
  }, [sessionId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Confirming your order...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h1>
            <p className="text-muted-foreground">Thank you for your order. Your dog's nutrition plan is now active.</p>
          </div>

          <div className="bg-card rounded-lg p-6 mb-8 text-left">
            <h2 className="text-xl font-semibold mb-4">What's Next?</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">First Delivery</h3>
                  <p className="text-sm text-muted-foreground">
                    Your first shipment will arrive within 5-7 business days.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Monthly Deliveries</h3>
                  <p className="text-sm text-muted-foreground">You'll receive fresh meals automatically every month.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button asChild size="lg" className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button variant="outline" asChild className="w-full bg-transparent">
              <Link href="/">Return Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
