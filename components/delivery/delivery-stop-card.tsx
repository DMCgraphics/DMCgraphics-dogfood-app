"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Package,
  MapPin,
  Clock,
  CheckCircle,
  Play,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  ExternalLink,
  Truck
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DeliveryStopCardProps {
  delivery: {
    id: string
    order_number: string
    stop_number: number
    guest_email: string | null
    recipe_name: string | null
    quantity: number
    delivery_zipcode: string
    delivery_address_line1: string | null
    delivery_address_line2: string | null
    delivery_city: string | null
    delivery_state: string | null
    estimated_delivery_date: string
    fulfillment_status: string
    route_notes: string | null
    distance_from_previous: string
    eta_from_previous: string
    driver_id?: string | null
  }
  onStatusUpdate: (deliveryId: string, newStatus: string) => Promise<void>
  onReportIssue: (deliveryId: string) => void
  onClaimOrder?: (deliveryId: string) => Promise<void>
  isCurrent?: boolean
  isProcessing?: boolean
  showDistance?: boolean
}

export function DeliveryStopCard({
  delivery,
  onStatusUpdate,
  onReportIssue,
  onClaimOrder,
  isCurrent = false,
  isProcessing = false,
  showDistance = true
}: DeliveryStopCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isUnassigned = !delivery.driver_id

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "looking_for_driver":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300">Looking for Driver</Badge>
      case "driver_assigned":
        return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300">Driver Assigned</Badge>
      case "pending":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Pending</Badge>
      case "preparing":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Preparing</Badge>
      case "out_for_delivery":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300">Out for Delivery</Badge>
      case "delivered":
        return <Badge className="bg-green-100 text-green-800 border-green-300">Delivered</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800 border-red-300">Failed</Badge>
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status.replace(/_/g, ' ')}</Badge>
    }
  }

  const getNextStatus = (currentStatus: string): string | null => {
    switch (currentStatus) {
      case "looking_for_driver":
      case "driver_assigned":
      case "pending":
        return "preparing"
      case "preparing":
        return "out_for_delivery"
      case "out_for_delivery":
        return "delivered"
      default:
        return null
    }
  }

  const getNextStatusLabel = (currentStatus: string): string => {
    switch (currentStatus) {
      case "looking_for_driver":
      case "driver_assigned":
      case "pending":
        return "Mark Preparing"
      case "preparing":
        return "Mark Out for Delivery"
      case "out_for_delivery":
        return "Mark Delivered"
      default:
        return ""
    }
  }

  const getNextStatusIcon = (currentStatus: string) => {
    if (currentStatus === "out_for_delivery") {
      return <CheckCircle className="h-5 w-5" />
    }
    return <Play className="h-5 w-5" />
  }

  const getGoogleMapsUrl = () => {
    const parts = []
    if (delivery.delivery_address_line1) parts.push(delivery.delivery_address_line1)
    if (delivery.delivery_address_line2) parts.push(delivery.delivery_address_line2)
    if (delivery.delivery_city) parts.push(delivery.delivery_city)
    if (delivery.delivery_state) parts.push(delivery.delivery_state)
    parts.push(delivery.delivery_zipcode)

    const address = parts.join(', ')
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  }

  const openInMaps = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(getGoogleMapsUrl(), '_blank')
  }

  const nextStatus = getNextStatus(delivery.fulfillment_status)
  const isCompleted = delivery.fulfillment_status === "delivered"
  const isFailed = delivery.fulfillment_status === "failed" || delivery.fulfillment_status === "cancelled"

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        isCurrent && "border-2 border-blue-500 shadow-lg",
        isCompleted && "opacity-60",
        isFailed && "border-red-300"
      )}
      onClick={() => !isCompleted && setIsExpanded(!isExpanded)}
      role="button"
      tabIndex={0}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header - Always Visible */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Badge
                variant="outline"
                className={cn(
                  "text-sm font-bold flex-shrink-0",
                  isCurrent && "bg-blue-600 text-white border-blue-600"
                )}
              >
                Stop #{delivery.stop_number}
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-600 flex-shrink-0" />
                  <span className="font-semibold text-lg truncate">
                    Order #{delivery.order_number}
                  </span>
                </div>
              </div>
            </div>
            {getStatusBadge(delivery.fulfillment_status)}
          </div>

          {/* Compact Info - Always Visible */}
          <div className="flex flex-col gap-2 text-sm">
            {/* Address - Clickable to open in Google Maps */}
            <button
              onClick={openInMaps}
              className="flex items-start gap-1 text-gray-700 hover:bg-blue-50 -mx-2 px-2 py-2 rounded-lg transition-colors group text-left w-full"
            >
              <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-600" />
              <div className="flex-1 min-w-0">
                {delivery.delivery_address_line1 ? (
                  <>
                    <div className="font-medium group-hover:text-blue-700">
                      {delivery.delivery_address_line1}
                      {delivery.delivery_address_line2 && `, ${delivery.delivery_address_line2}`}
                    </div>
                    <div className="text-gray-600 group-hover:text-blue-600">
                      {delivery.delivery_city && delivery.delivery_state
                        ? `${delivery.delivery_city}, ${delivery.delivery_state} ${delivery.delivery_zipcode}`
                        : delivery.delivery_zipcode}
                    </div>
                  </>
                ) : (
                  <span className="font-medium group-hover:text-blue-700">ZIP: {delivery.delivery_zipcode}</span>
                )}
              </div>
              <ExternalLink className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            {/* Recipe */}
            {delivery.recipe_name && (
              <div className="text-gray-600 pl-5">
                🍖 {delivery.recipe_name} ({delivery.quantity || 1})
              </div>
            )}
          </div>

          {/* Distance Info */}
          {showDistance && delivery.stop_number > 1 && (
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded">
              <Clock className="h-3 w-3" />
              <span>
                {delivery.distance_from_previous} from previous stop • {delivery.eta_from_previous}
              </span>
            </div>
          )}

          {/* Expanded Details */}
          {isExpanded && !isCompleted && (
            <div className="border-t pt-3 space-y-3">
              {/* Customer & Details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-600">Customer</div>
                  <div className="font-medium truncate">
                    {delivery.guest_email || "Registered user"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Quantity</div>
                  <div className="font-medium">{delivery.quantity || 1}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-600">Delivery Date</div>
                  <div className="font-medium">
                    {delivery.estimated_delivery_date
                      ? new Date(delivery.estimated_delivery_date).toLocaleDateString()
                      : "Not set"}
                  </div>
                </div>
              </div>

              {/* Route Notes */}
              {delivery.route_notes && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded">
                  <div className="text-xs font-medium text-amber-900 mb-1">Route Notes:</div>
                  <p className="text-sm text-amber-800">{delivery.route_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Claim Order Button (for unassigned orders) */}
          {isUnassigned && onClaimOrder && !isCompleted && !isFailed && (
            <div className="border-t pt-3">
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  onClaimOrder(delivery.id)
                }}
                disabled={isProcessing}
                className="w-full h-12 text-base font-semibold bg-purple-600 hover:bg-purple-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Truck className="h-5 w-5 mr-2" />
                    Claim This Delivery
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Action Buttons (for assigned orders) */}
          {!isUnassigned && nextStatus && !isCompleted && !isFailed && (
            <div className="border-t pt-3 flex gap-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  onStatusUpdate(delivery.id, nextStatus)
                }}
                disabled={isProcessing}
                className={cn(
                  "flex-1 h-12 text-base font-semibold",
                  nextStatus === "delivered" && "bg-green-600 hover:bg-green-700"
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    {getNextStatusIcon(delivery.fulfillment_status)}
                    <span className="ml-2">{getNextStatusLabel(delivery.fulfillment_status)}</span>
                  </>
                )}
              </Button>

              {delivery.fulfillment_status === "out_for_delivery" && (
                <Button
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    onReportIssue(delivery.id)
                  }}
                  disabled={isProcessing}
                  className="h-12 px-4"
                >
                  <AlertCircle className="h-5 w-5" />
                </Button>
              )}
            </div>
          )}

          {/* Completed State */}
          {isCompleted && (
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Delivery completed</span>
              </div>
            </div>
          )}

          {/* Failed State */}
          {isFailed && delivery.route_notes && (
            <div className="border-t pt-3">
              <div className="text-sm">
                <div className="font-medium text-red-600 mb-1">Issue reported:</div>
                <p className="text-gray-600">{delivery.route_notes}</p>
              </div>
            </div>
          )}

          {/* Expand/Collapse Indicator */}
          {!isCompleted && !isFailed && (
            <div className="flex justify-center pt-2">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
