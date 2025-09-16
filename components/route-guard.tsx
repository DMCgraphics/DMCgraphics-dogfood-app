"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { checkOrderStatus, hasValidSubscription, shouldRedirectToCheckout, getRedirectBanner } from "@/lib/route-guards"

interface RouteGuardProps {
  children: React.ReactNode
  requiresSubscription?: boolean
}

export function RouteGuard({ children, requiresSubscription = false }: RouteGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [showBanner, setShowBanner] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAccess = () => {
      if (!requiresSubscription) {
        setIsLoading(false)
        return
      }

      const orderStatus = checkOrderStatus()

      // If no order exists, redirect to plan builder
      if (!orderStatus) {
        console.log("[v0] dashboard_access_denied - no order found")
        router.push("/plan-builder")
        return
      }

      // If order is pending, show banner and redirect option
      if (shouldRedirectToCheckout()) {
        console.log("[v0] dashboard_access_denied - incomplete checkout", {
          orderId: orderStatus.orderId,
          status: orderStatus.status,
        })
        setShowBanner(true)
        setIsLoading(false)
        return
      }

      // If subscription is valid, allow access
      if (hasValidSubscription()) {
        console.log("[v0] dashboard_access_granted", {
          orderId: orderStatus.orderId,
          subscriptionId: orderStatus.subscriptionId,
        })
        setIsLoading(false)
        return
      }

      // Default: redirect to plan builder
      console.log("[v0] dashboard_access_denied - invalid subscription")
      router.push("/plan-builder")
    }

    checkAccess()
  }, [pathname, router, requiresSubscription])

  const handleCompleteCheckout = () => {
    console.log("[v0] redirect_to_checkout_clicked")
    router.push("/checkout")
  }

  const handleStartOver = () => {
    console.log("[v0] start_over_clicked")
    router.push("/plan-builder")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    )
  }

  if (showBanner) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{getRedirectBanner()}</span>
              </AlertDescription>
            </Alert>

            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold">Complete Your Order</h1>
              <p className="text-muted-foreground">
                You have an incomplete order. Complete checkout to access your dashboard and start your subscription.
              </p>

              <div className="flex gap-4 justify-center">
                <Button onClick={handleCompleteCheckout} size="lg">
                  Complete Checkout
                </Button>
                <Button onClick={handleStartOver} variant="outline" size="lg">
                  Start Over
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
