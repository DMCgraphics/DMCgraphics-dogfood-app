"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Truck, ChevronDown, ChevronUp, MapPin, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface RouteMetadata {
  total_stops: number
  completed_stops: number
  current_stop_index: number
  driver_zipcode: string | null
}

interface DeliveryStop {
  id: string
  order_number: string
  delivery_zipcode: string
  delivery_address_line1: string | null
  delivery_city: string | null
  delivery_state: string | null
  stop_number: number
  distance_from_previous: string
  eta_from_previous: string
  fulfillment_status: string
}

interface RouteOverviewCardProps {
  routeMeta: RouteMetadata
  deliveries: DeliveryStop[]
  nextStopDistance?: string
  nextStopEta?: string
}

export function RouteOverviewCard({
  routeMeta,
  deliveries,
  nextStopDistance,
  nextStopEta
}: RouteOverviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const { total_stops, completed_stops, current_stop_index } = routeMeta
  const remaining_stops = total_stops - completed_stops
  const progress_percentage = total_stops > 0 ? Math.round((completed_stops / total_stops) * 100) : 0

  // Find the current stop from deliveries (first active delivery is current)
  const activeDeliveries = deliveries.filter(d =>
    d.fulfillment_status !== "delivered" && d.fulfillment_status !== "cancelled" && d.fulfillment_status !== "failed"
  )
  const currentStop = activeDeliveries.length > 0 ? activeDeliveries[0] : null

  return (
    <Card className="sticky top-0 z-10 shadow-md border-2">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-bold">Your Route</h2>
            </div>
            {total_stops > 0 && (
              <Badge variant={remaining_stops === 0 ? "default" : "secondary"} className="text-sm">
                {remaining_stops === 0 ? "All Complete!" : `${remaining_stops} remaining`}
              </Badge>
            )}
          </div>

          {/* Progress Summary */}
          {total_stops > 0 && (
            <>
              <div className="text-sm text-gray-600">
                Stop {currentStop?.stop_number || total_stops} of {total_stops}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500 rounded-full",
                      remaining_stops === 0 ? "bg-green-500" : "bg-blue-600"
                    )}
                    style={{ width: `${progress_percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{completed_stops} completed</span>
                  <span>{progress_percentage}% complete</span>
                </div>
              </div>

              {/* Next Stop Info */}
              {currentStop && remaining_stops > 0 && (
                <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-600">Next Stop</div>
                    <div className="font-semibold text-sm truncate">
                      Order #{currentStop.order_number}
                    </div>
                    {/* Address with Google Maps link */}
                    {currentStop.delivery_address_line1 && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${currentStop.delivery_address_line1}${currentStop.delivery_address_line2 ? ' ' + currentStop.delivery_address_line2 : ''}, ${currentStop.delivery_city || ''} ${currentStop.delivery_state || ''} ${currentStop.delivery_zipcode || ''}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline truncate block"
                      >
                        {currentStop.delivery_address_line1}
                        {currentStop.delivery_address_line2 && `, ${currentStop.delivery_address_line2}`}
                        {currentStop.delivery_city && `, ${currentStop.delivery_city}`} {currentStop.delivery_zipcode}
                      </a>
                    )}
                  </div>
                  {nextStopDistance && nextStopEta && (
                    <div className="flex items-center gap-1 text-sm font-medium text-blue-600">
                      <Clock className="h-3 w-3" />
                      <span>{nextStopDistance} • {nextStopEta}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {total_stops === 0 && (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">No deliveries scheduled</p>
            </div>
          )}

          {/* Expand/Collapse Button */}
          {total_stops > 0 && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Hide Full Route
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show Full Route
                </>
              )}
            </Button>
          )}

          {/* Full Route List */}
          {isExpanded && total_stops > 0 && (
            <div className="border-t pt-3 space-y-2 max-h-64 overflow-y-auto">
              {deliveries.map((delivery, index) => {
                const isCompleted = delivery.fulfillment_status === "delivered"
                const isFailed = delivery.fulfillment_status === "failed" || delivery.fulfillment_status === "cancelled"
                // First active delivery is current
                const isActive = !isCompleted && !isFailed
                const activeIndex = deliveries.filter((d, i) =>
                  i < index && d.fulfillment_status !== "delivered" && d.fulfillment_status !== "cancelled" && d.fulfillment_status !== "failed"
                ).length
                const isCurrent = isActive && activeIndex === 0

                return (
                  <div
                    key={delivery.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded text-sm",
                      isCurrent && "bg-blue-100 border border-blue-300",
                      isCompleted && "bg-green-50 text-gray-500",
                      isFailed && "bg-red-50 text-gray-500",
                      !isCurrent && !isCompleted && !isFailed && "bg-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Badge
                        variant={isCompleted ? "default" : "outline"}
                        className={cn(
                          "text-xs",
                          isCurrent && "bg-blue-600 text-white",
                          isFailed && "bg-red-100 text-red-800"
                        )}
                      >
                        #{delivery.stop_number}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className={cn("font-medium truncate", isCompleted && "line-through")}>
                          Order #{delivery.order_number}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {delivery.delivery_address_line1
                            ? `${delivery.delivery_address_line1}, ${delivery.delivery_city || ''} ${delivery.delivery_zipcode}`
                            : `ZIP: ${delivery.delivery_zipcode}`}
                        </div>
                      </div>
                    </div>
                    {delivery.stop_number > 1 && (
                      <div className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {delivery.distance_from_previous}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
