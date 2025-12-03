"use client"

import { cn } from "@/lib/utils"
import {
  Search,
  UserCheck,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { TrackingEvent } from "@/lib/realtime/order-tracking"

interface TimelineStage {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
}

const TIMELINE_STAGES: TimelineStage[] = [
  {
    key: "looking_for_driver",
    label: "Looking for a driver...",
    icon: Search,
    description: "We're finding the best driver for your delivery",
  },
  {
    key: "driver_assigned",
    label: "Driver assigned!",
    icon: UserCheck,
    description: "Your Nouri Bag is being packed...",
  },
  {
    key: "preparing",
    label: "Preparing your order",
    icon: Package,
    description: "Your fresh food is being packed with care",
  },
  {
    key: "out_for_delivery",
    label: "Out for delivery",
    icon: Truck,
    description: "Your order is on its way!",
  },
  {
    key: "delivered",
    label: "Delivered!",
    icon: CheckCircle,
    description: "Enjoy your fresh Nouri meals",
  },
]

interface OrderTrackingTimelineProps {
  currentStatus: string
  events: TrackingEvent[]
  isLive?: boolean
}

export function OrderTrackingTimeline({
  currentStatus,
  events,
  isLive = false,
}: OrderTrackingTimelineProps) {
  // Determine which stages are completed
  const getCurrentStageIndex = (status: string) => {
    const index = TIMELINE_STAGES.findIndex((stage) => stage.key === status)
    return index >= 0 ? index : 0
  }

  const currentStageIndex = getCurrentStageIndex(currentStatus)

  // Handle cancelled/failed states
  const isCancelled = currentStatus === "cancelled"
  const isFailed = currentStatus === "failed"

  if (isCancelled || isFailed) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-red-600">
            <XCircle className="h-8 w-8" />
            <div>
              <h3 className="font-semibold text-lg">
                {isCancelled ? "Order Cancelled" : "Delivery Failed"}
              </h3>
              <p className="text-sm text-red-600/80">
                {isCancelled
                  ? "This order has been cancelled."
                  : "There was an issue with delivery. Please contact support."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Live indicator */}
      {isLive && (
        <div className="flex items-center gap-2 text-sm">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </div>
          <span className="text-muted-foreground font-medium">Live updates</span>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-4">
        {TIMELINE_STAGES.map((stage, index) => {
          const isCompleted = index < currentStageIndex
          const isCurrent = index === currentStageIndex
          const isPending = index > currentStageIndex

          const Icon = stage.icon

          // Find relevant event for this stage
          const stageEvent = events.find((e) => e.event_type === stage.key)

          return (
            <div key={stage.key} className="relative flex gap-4">
              {/* Connector line */}
              {index < TIMELINE_STAGES.length - 1 && (
                <div
                  className={cn(
                    "absolute left-5 top-12 w-0.5 h-full -translate-x-1/2",
                    isCompleted || isCurrent ? "bg-green-500" : "bg-gray-200"
                  )}
                />
              )}

              {/* Icon */}
              <div
                className={cn(
                  "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                  isCompleted && "bg-green-500 border-green-500 text-white",
                  isCurrent &&
                    "bg-blue-500 border-blue-500 text-white animate-pulse shadow-lg shadow-blue-500/50",
                  isPending && "bg-white border-gray-300 text-gray-400"
                )}
              >
                {isCurrent && !isCompleted ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-8">
                <div
                  className={cn(
                    "font-semibold text-lg mb-1",
                    isCompleted && "text-green-700",
                    isCurrent && "text-blue-700",
                    isPending && "text-gray-400"
                  )}
                >
                  {stage.label}
                </div>

                <p
                  className={cn(
                    "text-sm mb-2",
                    isCompleted && "text-green-600/80",
                    isCurrent && "text-blue-600/80",
                    isPending && "text-gray-400"
                  )}
                >
                  {stageEvent?.description || stage.description}
                </p>

                {stageEvent && (
                  <div className="text-xs text-muted-foreground">
                    {new Date(stageEvent.created_at).toLocaleString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Additional events that don't fit the standard timeline */}
      {events.filter((e) => !TIMELINE_STAGES.some((s) => s.key === e.event_type)).length > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-3 text-sm">Additional Updates</h4>
            <div className="space-y-2">
              {events
                .filter((e) => !TIMELINE_STAGES.some((s) => s.key === e.event_type))
                .map((event) => (
                  <div key={event.id} className="text-sm">
                    <div className="font-medium">{event.description}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
