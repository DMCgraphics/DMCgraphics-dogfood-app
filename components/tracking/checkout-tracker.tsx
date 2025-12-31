"use client"

import { useEffect } from "react"
import { metaPixelEvents } from "@/components/meta-pixel"

interface CheckoutTrackerProps {
  total: number
  itemCount: number
}

/**
 * Client component to track InitiateCheckout event for Meta Pixel
 * Place this in the checkout page to fire when user reaches checkout
 */
export function CheckoutTracker({ total, itemCount }: CheckoutTrackerProps) {
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      // Track checkout initiation
      metaPixelEvents.initiateCheckout({
        value: total,
        currency: "USD",
        num_items: itemCount,
      })
    } catch (error) {
      // Silently fail - don't break the page if tracking fails
      console.warn("[CheckoutTracker] Failed to track event:", error)
    }
  }, [total, itemCount])

  return null // This component doesn't render anything
}
