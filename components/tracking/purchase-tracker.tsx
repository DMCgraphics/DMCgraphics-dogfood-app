"use client"

import { useEffect } from "react"
import { metaPixelEvents } from "@/components/meta-pixel"

interface PurchaseTrackerProps {
  value: number
  subscriptionId?: string
  planId?: string
}

/**
 * Client component to track Purchase/Subscribe event for Meta Pixel
 * Place this in the checkout success page to fire when purchase completes
 */
export function PurchaseTracker({ value, subscriptionId, planId }: PurchaseTrackerProps) {
  useEffect(() => {
    // Track purchase/subscription completion
    metaPixelEvents.subscribe({
      value,
      currency: "USD",
      predicted_ltv: value * 12, // Estimate lifetime value as 12 months of subscription
    })

    // Also track as a purchase event
    metaPixelEvents.purchase({
      value,
      currency: "USD",
      content_ids: subscriptionId ? [subscriptionId] : planId ? [planId] : undefined,
      content_type: "product",
    })
  }, [value, subscriptionId, planId])

  return null // This component doesn't render anything
}
