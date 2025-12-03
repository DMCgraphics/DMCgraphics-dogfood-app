"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle, Package, Calendar, Truck, Eye } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const isGuest = searchParams.get("guest") === "true"
  const [orderData, setOrderData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [guestEmail, setGuestEmail] = useState<string>("")
  const [orderId, setOrderId] = useState<string | null>(null)
  const { user, isLoading: authLoading, refreshSubscriptionStatus } = useAuth()
  const processingRef = useRef(false)

  useEffect(() => {
    const handleSuccessfulPayment = async () => {
      if (!sessionId) {
        console.log("[v0] No session ID provided")
        setError("No session ID provided")
        setIsLoading(false)
        return
      }

      // Prevent multiple executions using ref
      if (processingRef.current) {
        console.log("[v0] Payment already processing, skipping duplicate call...")
        return;
      }
      processingRef.current = true; // Mark as processing

      // Note: We can now proceed without waiting for authentication since verify-payment API
      // can work with user_id from session metadata
      console.log("[v0] Proceeding with payment verification...", { 
        sessionId, 
        hasUser: !!user, 
        authLoading,
        userId: user?.id 
      })

      try {
        console.log("[v0] Processing successful payment for session:", sessionId)
        console.log("[v0] User authenticated:", !!user, "User ID:", user?.id, "Is guest:", isGuest)

        // For guest orders, just fetch session data from Stripe
        if (isGuest && !user) {
          console.log("[v0] Guest checkout - fetching session details...")
          const sessionResponse = await fetch(`/api/checkout-session?session_id=${sessionId}`)

          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json()
            setOrderData({ ...sessionData, mode: sessionData.mode || 'payment' })
            setGuestEmail(sessionData.customer_email || "")
            console.log("[v0] Guest order processed:", sessionData)

            // Fetch order ID from database for tracking
            if (sessionData.mode === 'payment') {
              try {
                const { data: order } = await supabase
                  .from('orders')
                  .select('id')
                  .eq('stripe_checkout_session_id', sessionId)
                  .maybeSingle()

                if (order) {
                  setOrderId(order.id)
                  console.log("[v0] Found order ID for guest:", order.id)
                }
              } catch (err) {
                console.error("[v0] Error fetching order ID:", err)
              }
            }
          } else {
            throw new Error("Failed to fetch session details")
          }
          setIsLoading(false)
          return
        }

        // First, fetch session data to determine if this is a subscription or one-time purchase
        console.log("[v0] Fetching session details...")
        const sessionResponse = await fetch(`/api/checkout-session?session_id=${sessionId}`)

        if (!sessionResponse.ok) {
          throw new Error("Failed to fetch session details")
        }

        const sessionData = await sessionResponse.json()
        const isSubscription = sessionData.mode === 'subscription'

        console.log("[v0] Session type:", sessionData.mode, "Is subscription:", isSubscription)

        // For authenticated users with subscriptions, verify the session and update plan status
        if (isSubscription) {
          console.log("[v0] Calling /api/verify-payment endpoint...")
          const verifyResponse = await fetch("/api/verify-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sessionId }),
          })

          if (!verifyResponse.ok) {
            const errorData = await verifyResponse.json().catch(() => ({ error: "Unknown error" }))
            console.error("[v0] Verify payment failed:", verifyResponse.status, errorData)
            const errorMessage = errorData.error || errorData.message || "Unknown error"
            const errorDetails = errorData.details ? `\n\nDetails: ${errorData.details}` : ""
            setError(`Payment verification failed: ${errorMessage}${errorDetails}`)
            setIsLoading(false)
            return
          }

          const verifyData = await verifyResponse.json()
          setOrderData({ ...verifyData, mode: 'subscription' })
          console.log("[v0] Payment verified successfully:", verifyData)

          // Note: Removed supabase.auth.refreshSession() as it was causing the useEffect to re-run
          // The user object is now stable in the dependency array (user?.id)

          // Refresh subscription status in auth context
          console.log("[v0] Refreshing subscription status...")
          try {
            await refreshSubscriptionStatus()
            console.log("[v0] Subscription status refreshed successfully")
          } catch (subRefreshError) {
            console.log("[v0] Subscription status refresh failed:", subRefreshError)
          }

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
          // For one-time purchases by authenticated users, just use session data
          console.log("[v0] One-time purchase - using session data")
          setOrderData({ ...sessionData, mode: 'payment' })

          // Fetch order ID from database for tracking
          try {
            const { data: order } = await supabase
              .from('orders')
              .select('id')
              .eq('stripe_checkout_session_id', sessionId)
              .maybeSingle()

            if (order) {
              setOrderId(order.id)
              console.log("[v0] Found order ID for authenticated user:", order.id)
            }
          } catch (err) {
            console.error("[v0] Error fetching order ID:", err)
          }
        }
      } catch (error) {
        console.error("Error verifying payment:", error)
        setError("An error occurred while verifying your payment")
      } finally {
        setIsLoading(false)
        processingRef.current = false; // Mark as not processing
      }
    }

    handleSuccessfulPayment()
  }, [sessionId, authLoading, user?.id]) // Use user.id instead of user object to prevent infinite loop

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

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-destructive mb-4">
            <Package className="h-16 w-16 mx-auto mb-4" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Order Processing Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
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
    )
  }

  // Guest checkout success
  if (isGuest && !user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-green-600 mb-2">Order Confirmed!</h1>
              <p className="text-muted-foreground">
                Thank you for your order. We've sent a confirmation to <strong>{guestEmail}</strong>
              </p>
            </div>

            <div className="bg-card rounded-lg p-6 mb-8 text-left border-2 border-primary/20">
              <h2 className="text-xl font-semibold mb-4">What's Next?</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Local Delivery - 24-48 Hours</h3>
                    <p className="text-sm text-muted-foreground">
                      We're looking for a driver now. Your fresh food will arrive within 24-48 hours!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Track Order Button */}
            {orderId && (
              <div className="mb-8">
                <Button asChild size="lg" className="w-full gap-2">
                  <Link href={`/order/track/${orderId}?session_id=${sessionId}`}>
                    <Eye className="h-5 w-5" />
                    Track Your Order Live
                  </Link>
                </Button>
              </div>
            )}

            {/* Account Creation Prompt */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold mb-2 text-blue-900">Want to track your order?</h3>
              <p className="text-sm text-blue-800 mb-4">
                Create a free account to view your order status, manage deliveries, and get personalized recommendations for your dog.
              </p>
              <div className="space-y-3">
                <Button asChild size="lg" className="w-full">
                  <Link href={`/auth/signup?email=${encodeURIComponent(guestEmail)}`}>
                    Create Free Account
                  </Link>
                </Button>
                <p className="text-xs text-blue-700">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="underline font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Button variant="outline" asChild className="w-full">
                <Link href="/shop/individual-packs">Continue Shopping</Link>
              </Button>
              <Button variant="ghost" asChild className="w-full">
                <Link href="/">Return Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Determine if this is a subscription or one-time purchase
  const isSubscriptionOrder = orderData?.mode === 'subscription'

  // Authenticated user success
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-green-600 mb-2">
              {isSubscriptionOrder ? "Payment Successful!" : "Order Confirmed!"}
            </h1>
            <p className="text-muted-foreground">
              {isSubscriptionOrder
                ? "Thank you for your order. Your dog's nutrition plan is now active."
                : "Thank you for your order. We'll send confirmation and delivery updates to your email."}
            </p>
          </div>

          <div className="bg-card rounded-lg p-6 mb-8 text-left border-2 border-primary/20">
            <h2 className="text-xl font-semibold mb-4">What's Next?</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">{isSubscriptionOrder ? "First Delivery" : "Local Delivery - 24-48 Hours"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isSubscriptionOrder
                      ? "Your first delivery arrives Sunday via local delivery. You'll receive a notification Saturday evening."
                      : "We're looking for a driver now. Your fresh food will arrive within 24-48 hours!"}
                  </p>
                </div>
              </div>
              {isSubscriptionOrder && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Bi-Weekly Sunday Deliveries</h3>
                    <p className="text-sm text-muted-foreground">You'll receive fresh meals every other Sunday via local delivery.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Track order button for individual packs */}
            {!isSubscriptionOrder && orderId && (
              <Button asChild size="lg" className="w-full gap-2">
                <Link href={`/order/track/${orderId}`}>
                  <Eye className="h-5 w-5" />
                  Track Your Order Live
                </Link>
              </Button>
            )}
            <Button asChild size="lg" className="w-full" variant={!isSubscriptionOrder && orderId ? "outline" : "default"}>
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
