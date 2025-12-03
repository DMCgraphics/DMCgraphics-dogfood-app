"use client"

import { useEffect, useState } from "react"
import { DeliveryStatusBanner } from "./delivery-status-banner"
import { useAuth } from "@/contexts/auth-context"

interface ActiveOrder {
  id: string
  fulfillment_status: string
}

export function GlobalDeliveryBanner() {
  const { user } = useAuth()
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchActiveOrder() {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        // Fetch user's orders
        const response = await fetch("/api/orders")

        if (response.ok) {
          const data = await response.json()
          const orders = data.orders || []

          // Find the most recent order that's in progress (not delivered/cancelled)
          const inProgressStatuses = [
            "looking_for_driver",
            "driver_assigned",
            "preparing",
            "out_for_delivery",
          ]

          const inProgressOrder = orders.find(
            (order: any) =>
              order.hasTracking && inProgressStatuses.includes(order.fulfillmentStatus)
          )

          if (inProgressOrder) {
            setActiveOrder({
              id: inProgressOrder.id,
              fulfillment_status: inProgressOrder.fulfillmentStatus,
            })
          }
        }
      } catch (error) {
        console.error("[GLOBAL BANNER] Error fetching orders:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActiveOrder()
  }, [user])

  // Don't show anything while loading or if no active order
  if (isLoading || !activeOrder) {
    return null
  }

  return <DeliveryStatusBanner orderId={activeOrder.id} />
}
