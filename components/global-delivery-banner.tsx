"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { DeliveryStatusBanner } from "./delivery-status-banner"
import { useAuth } from "@/contexts/auth-context"

interface ActiveOrder {
  id: string
  fulfillment_status: string
}

export function GlobalDeliveryBanner() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchActiveOrder() {
      if (!user) {
        console.log("[GLOBAL BANNER] No user, skipping")
        setIsLoading(false)
        return
      }

      try {
        console.log("[GLOBAL BANNER] Fetching orders for user:", user.email)
        // Fetch user's orders
        const response = await fetch("/api/orders")

        if (response.ok) {
          const data = await response.json()
          const orders = data.orders || []
          console.log("[GLOBAL BANNER] Fetched orders:", orders.length)

          // Find the most recent order that's in progress (not delivered/cancelled)
          const inProgressStatuses = [
            "looking_for_driver",
            "driver_assigned",
            "preparing",
            "out_for_delivery",
          ]

          const inProgressOrder = orders.find(
            (order: any) => {
              console.log("[GLOBAL BANNER] Checking order:", {
                id: order.id,
                hasTracking: order.hasTracking,
                fulfillmentStatus: order.fulfillmentStatus,
                isInProgress: inProgressStatuses.includes(order.fulfillmentStatus)
              })
              return order.hasTracking && inProgressStatuses.includes(order.fulfillmentStatus)
            }
          )

          if (inProgressOrder) {
            console.log("[GLOBAL BANNER] Found active order:", inProgressOrder.id)
            setActiveOrder({
              id: inProgressOrder.id,
              fulfillment_status: inProgressOrder.fulfillmentStatus,
            })
          } else {
            console.log("[GLOBAL BANNER] No active orders found")
          }
        } else {
          console.error("[GLOBAL BANNER] Failed to fetch orders:", response.status)
        }
      } catch (error) {
        console.error("[GLOBAL BANNER] Error fetching orders:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActiveOrder()
  }, [user])

  // Don't show on tracking pages (redundant)
  if (pathname?.includes("/track")) {
    return null
  }

  // Don't show anything while loading or if no active order
  if (isLoading || !activeOrder) {
    return null
  }

  return <DeliveryStatusBanner orderId={activeOrder.id} />
}
