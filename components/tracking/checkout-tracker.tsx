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
    // Track checkout initiation
    metaPixelEvents.initiateCheckout({
      value: total,
      currency: "USD",
      num_items: itemCount,
    })
  }, [total, itemCount])

  return null // This component doesn't render anything
}
