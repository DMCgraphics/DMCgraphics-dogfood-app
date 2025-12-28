import { useState, useEffect, useCallback } from "react"
import {
  subscribeToOrderUpdates,
  type TrackingEvent,
  type OrderUpdate,
} from "@/lib/realtime/order-tracking"
import { useAuth } from "@/contexts/auth-context"

interface OrderData {
  id: string
  order_type: string
  status: string
  fulfillment_status: string
  total_cents: number
  recipes: any[]
  delivery_zipcode?: string
  estimated_delivery_window?: string
  estimated_delivery_date?: string
  driver_id?: string
  driver_name?: string
  driver_phone?: string
  created_at: string
  user?: {
    name: string
    email: string
  }
}

interface UseOrderTrackingResult {
  order: OrderData | null
  events: TrackingEvent[]
  isConnected: boolean
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * React hook for real-time order tracking
 * Fetches initial order data and subscribes to live updates via Supabase Realtime
 */
export function useOrderTracking(
  orderId: string,
  sessionId?: string | null,
  token?: string | null
): UseOrderTrackingResult {
  const { user } = useAuth()
  const [order, setOrder] = useState<OrderData | null>(null)
  const [events, setEvents] = useState<TrackingEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrderData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Build URL with optional session_id for guest access and token for public tracking links
      const url = new URL(`/api/orders/${orderId}/tracking`, window.location.origin)
      if (sessionId) {
        url.searchParams.set("session_id", sessionId)
      }
      if (token) {
        url.searchParams.set("token", token)
      }

      console.log("[ORDER TRACKING] Fetching order data:", url.toString(), "User:", user?.email)

      const response = await fetch(url.toString())

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized. Please sign in to view this order.")
        } else if (response.status === 404) {
          throw new Error("Order not found.")
        } else {
          throw new Error(`Failed to fetch order: ${response.statusText}`)
        }
      }

      const data = await response.json()
      console.log("[ORDER TRACKING] Received data:", data)

      setOrder(data.order)
      setEvents(data.events || [])
    } catch (err) {
      console.error("[ORDER TRACKING] Error fetching order:", err)
      setError(err instanceof Error ? err.message : "Failed to load order")
    } finally {
      setIsLoading(false)
    }
  }, [orderId, sessionId, token, user])

  // Fetch initial data and refetch when user auth state changes
  useEffect(() => {
    fetchOrderData()
  }, [fetchOrderData])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!orderId) return

    console.log("[ORDER TRACKING] Setting up real-time subscriptions for:", orderId)

    const unsubscribe = subscribeToOrderUpdates(orderId, {
      onOrderUpdate: (updatedOrder) => {
        console.log("[ORDER TRACKING] Received order update:", updatedOrder)
        setOrder((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            ...updatedOrder,
          }
        })
      },
      onTrackingEvent: (newEvent) => {
        console.log("[ORDER TRACKING] Received new tracking event:", newEvent)
        setEvents((prev) => {
          // Avoid duplicates
          if (prev.some((e) => e.id === newEvent.id)) {
            return prev
          }
          return [...prev, newEvent].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        })
      },
      onConnectionChange: (connected) => {
        console.log("[ORDER TRACKING] Connection status:", connected)
        setIsConnected(connected)
      },
    })

    // Cleanup on unmount
    return () => {
      console.log("[ORDER TRACKING] Cleaning up subscriptions")
      unsubscribe()
    }
  }, [orderId])

  return {
    order,
    events,
    isConnected,
    isLoading,
    error,
    refetch: fetchOrderData,
  }
}
