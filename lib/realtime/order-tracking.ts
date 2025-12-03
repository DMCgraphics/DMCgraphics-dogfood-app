import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface TrackingEvent {
  id: string
  order_id: string
  event_type: string
  description: string
  metadata: Record<string, any>
  created_at: string
  created_by?: string
}

export interface OrderUpdate {
  id: string
  fulfillment_status: string
  driver_id?: string
  driver_name?: string
  driver_phone?: string
  estimated_delivery_window?: string
  estimated_delivery_date?: string
  updated_at: string
}

type OrderCallback = (data: any) => void

/**
 * Subscribe to real-time updates for a specific order
 * Returns an unsubscribe function to clean up the subscription
 */
export function subscribeToOrderUpdates(
  orderId: string,
  callbacks: {
    onOrderUpdate?: (order: OrderUpdate) => void
    onTrackingEvent?: (event: TrackingEvent) => void
    onConnectionChange?: (connected: boolean) => void
  }
): () => void {
  const supabase = createClient()
  const channels: RealtimeChannel[] = []

  console.log("[REALTIME] Subscribing to order updates:", orderId)

  // Subscribe to orders table changes
  const orderChannel = supabase
    .channel(`order:${orderId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${orderId}`,
      },
      (payload) => {
        console.log("[REALTIME] Order updated:", payload)
        if (callbacks.onOrderUpdate && payload.new) {
          callbacks.onOrderUpdate(payload.new as OrderUpdate)
        }
      }
    )
    .subscribe((status) => {
      console.log("[REALTIME] Order channel status:", status)
      if (callbacks.onConnectionChange) {
        callbacks.onConnectionChange(status === "SUBSCRIBED")
      }
    })

  channels.push(orderChannel)

  // Subscribe to tracking events
  const eventsChannel = supabase
    .channel(`order-events:${orderId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "delivery_tracking_events",
        filter: `order_id=eq.${orderId}`,
      },
      (payload) => {
        console.log("[REALTIME] New tracking event:", payload)
        if (callbacks.onTrackingEvent && payload.new) {
          callbacks.onTrackingEvent(payload.new as TrackingEvent)
        }
      }
    )
    .subscribe((status) => {
      console.log("[REALTIME] Events channel status:", status)
    })

  channels.push(eventsChannel)

  // Return cleanup function
  return () => {
    console.log("[REALTIME] Unsubscribing from order:", orderId)
    channels.forEach((channel) => {
      supabase.removeChannel(channel)
    })
  }
}

/**
 * Subscribe to all orders for a specific fulfillment status (admin use)
 * Useful for admin dashboard to see new orders coming in
 */
export function subscribeToOrderQueue(
  status: string,
  callback: (order: OrderUpdate) => void
): () => void {
  const supabase = createClient()

  console.log("[REALTIME] Subscribing to order queue with status:", status)

  const channel = supabase
    .channel(`order-queue:${status}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `fulfillment_status=eq.${status}`,
      },
      (payload) => {
        console.log("[REALTIME] Order queue update:", payload)
        if (payload.new) {
          callback(payload.new as OrderUpdate)
        }
      }
    )
    .subscribe((status) => {
      console.log("[REALTIME] Queue channel status:", status)
    })

  return () => {
    console.log("[REALTIME] Unsubscribing from order queue")
    supabase.removeChannel(channel)
  }
}

/**
 * Get the descriptive text for each tracking event type
 */
export function getEventDescription(eventType: string, metadata?: Record<string, any>): string {
  const descriptions: Record<string, string> = {
    order_placed: "Order confirmed and payment received",
    driver_assigned: metadata?.driver_name
      ? `${metadata.driver_name} has been assigned to your order`
      : "Driver assigned! Your Nouri Bag is being packed...",
    preparing: "Packing your order...",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered!",
    cancelled: "Order cancelled",
    failed: "Delivery failed",
  }

  return descriptions[eventType] || eventType
}

/**
 * Get the friendly status label for fulfillment status
 */
export function getFulfillmentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    looking_for_driver: "Looking for a driver...",
    driver_assigned: "Driver assigned",
    preparing: "Preparing your order",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
    failed: "Failed",
  }

  return labels[status] || status
}
