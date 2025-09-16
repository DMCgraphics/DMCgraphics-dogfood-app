"use client"
import { useEffect } from "react"

export function SuccessBridge({ subscriptionId }: { subscriptionId?: string | null }) {
  useEffect(() => {
    if (subscriptionId) {
      localStorage.setItem(
        "nouripet-order-confirmation",
        JSON.stringify({ orderId: subscriptionId, subscriptionId, timestamp: new Date().toISOString() }),
      )
      // kick the header listener
      window.dispatchEvent(new StorageEvent("storage", { key: "nouripet-order-confirmation" } as any))
    }
  }, [subscriptionId])
  return null
}
