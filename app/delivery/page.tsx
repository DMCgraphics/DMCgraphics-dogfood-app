"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Loader2, AlertCircle, RefreshCw, Calendar as CalendarIcon } from "lucide-react"
import Link from "next/link"
import { RouteOverviewCard } from "@/components/delivery/route-overview-card"
import { DeliveryStopCard } from "@/components/delivery/delivery-stop-card"
import { FailedDeliveryModal } from "@/components/delivery/failed-delivery-modal"
import { DriverCalendar } from "@/components/delivery/driver-calendar"

interface Delivery {
  id: string
  order_number: string
  user_id: string | null
  guest_email: string | null
  estimated_delivery_date: string
  fulfillment_status: string
  recipe_name: string
  quantity: number
  delivery_method: string
  delivery_zipcode: string
  delivery_address_line1: string | null
  delivery_address_line2: string | null
  delivery_city: string | null
  delivery_state: string | null
  tracking_token: string
  route_notes: string | null
  stop_number: number
  distance_from_previous: string
  eta_from_previous: string
  distance_score: number
}

interface RouteMetadata {
  total_stops: number
  completed_stops: number
  current_stop_index: number
  driver_zipcode: string | null
}

export default function DeliveryPage() {
  const router = useRouter()
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [routeMeta, setRouteMeta] = useState<RouteMetadata>({
    total_stops: 0,
    completed_stops: 0,
    current_stop_index: 0,
    driver_zipcode: null
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "pending" | "delivered">("pending")
  const [showCalendar, setShowCalendar] = useState(false)
  const [failedDeliveryModal, setFailedDeliveryModal] = useState<{
    isOpen: boolean
    deliveryId: string | null
    orderNumber: string
  }>({
    isOpen: false,
    deliveryId: null,
    orderNumber: ""
  })

  const currentStopRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchDeliveries()
  }, [filter])

  // Auto-scroll to current delivery on load and after status updates
  useEffect(() => {
    if (!isLoading && deliveries.length > 0 && currentStopRef.current) {
      setTimeout(() => {
        currentStopRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        })
      }, 300)
    }
  }, [isLoading, routeMeta.current_stop_index])

  async function fetchDeliveries() {
    try {
      setIsLoading(true)
      const statusParam = filter === "all" ? "" : `?status=${filter}`
      const response = await fetch(`/api/deliveries/driver${statusParam}`)

      if (response.status === 401) {
        router.push("/auth/login")
        return
      }

      if (response.status === 403) {
        setError("You don't have permission to access this page")
        return
      }

      if (!response.ok) {
        throw new Error("Failed to fetch deliveries")
      }

      const data = await response.json()
      setDeliveries(data.deliveries || [])
      setRouteMeta(data.route_meta || {
        total_stops: 0,
        completed_stops: 0,
        current_stop_index: 0,
        driver_zipcode: null
      })
    } catch (err: any) {
      console.error("Error fetching deliveries:", err)
      setError(err.message || "Failed to load deliveries")
    } finally {
      setIsLoading(false)
    }
  }

  async function updateDeliveryStatus(deliveryId: string, newStatus: string, notes?: string) {
    setProcessingId(deliveryId)
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, driver_notes: notes }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update status")
      }

      // Refresh deliveries
      await fetchDeliveries()
    } catch (err: any) {
      console.error("Error updating delivery status:", err)
      alert(err.message || "Failed to update delivery status")
    } finally {
      setProcessingId(null)
    }
  }

  async function handleClaimOrder(deliveryId: string) {
    setProcessingId(deliveryId)
    try {
      const response = await fetch("/api/deliveries/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: deliveryId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to claim order")
      }

      // Refresh deliveries
      await fetchDeliveries()
    } catch (err: any) {
      console.error("Error claiming order:", err)
      alert(err.message || "Failed to claim order")
    } finally {
      setProcessingId(null)
    }
  }

  function handleReportIssue(deliveryId: string) {
    const delivery = deliveries.find(d => d.id === deliveryId)
    if (delivery) {
      setFailedDeliveryModal({
        isOpen: true,
        deliveryId,
        orderNumber: delivery.order_number
      })
    }
  }

  async function handleFailedDeliverySubmit(reason: string) {
    if (failedDeliveryModal.deliveryId) {
      await updateDeliveryStatus(failedDeliveryModal.deliveryId, "failed", reason)
    }
  }

  // Separate deliveries by status
  const activeDeliveries = deliveries.filter(
    d => d.fulfillment_status !== "delivered" && d.fulfillment_status !== "cancelled" && d.fulfillment_status !== "failed"
  )
  const completedDeliveries = deliveries.filter(
    d => d.fulfillment_status === "delivered" || d.fulfillment_status === "cancelled" || d.fulfillment_status === "failed"
  )

  // Get next stop info for route overview
  // The first active delivery is the current one
  const currentDelivery = activeDeliveries.length > 0 ? activeDeliveries[0] : null
  const nextStopDistance = currentDelivery?.distance_from_previous
  const nextStopEta = currentDelivery?.eta_from_previous

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium mb-4">{error}</p>
            <Button onClick={() => router.push("/")}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div className="flex gap-2">
              <Button
                variant={filter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("pending")}
              >
                Active
              </Button>
              <Button
                variant={filter === "delivered" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("delivered")}
              >
                Done
              </Button>
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                All
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCalendar(!showCalendar)}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                {showCalendar ? "Hide" : "Show"} Calendar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchDeliveries}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && deliveries.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">Loading your route...</span>
        </div>
      ) : (
        <div className="container py-4 space-y-4">
          {/* Calendar View */}
          {showCalendar && (
            <div className="mb-4">
              <DriverCalendar />
            </div>
          )}

          {/* Route Overview Card */}
          <RouteOverviewCard
            routeMeta={routeMeta}
            deliveries={deliveries}
            nextStopDistance={nextStopDistance}
            nextStopEta={nextStopEta}
          />

          {/* Active Deliveries */}
          {activeDeliveries.length > 0 && (
            <div className="space-y-3">
              {activeDeliveries.map((delivery, index) => {
                // First active delivery is the current one
                const isCurrent = index === 0
                return (
                  <div
                    key={delivery.id}
                    ref={isCurrent ? currentStopRef : null}
                  >
                    <DeliveryStopCard
                      delivery={delivery}
                      onStatusUpdate={updateDeliveryStatus}
                      onReportIssue={handleReportIssue}
                      onClaimOrder={handleClaimOrder}
                      isCurrent={isCurrent}
                      isProcessing={processingId === delivery.id}
                      showDistance={index > 0}
                    />
                  </div>
                )
              })}
            </div>
          )}

          {/* Completed Deliveries */}
          {completedDeliveries.length > 0 && filter !== "pending" && (
            <div className="space-y-3 mt-6">
              <div className="text-sm font-medium text-gray-500 px-2">
                Completed ({completedDeliveries.length})
              </div>
              {completedDeliveries.map((delivery) => (
                <DeliveryStopCard
                  key={delivery.id}
                  delivery={delivery}
                  onStatusUpdate={updateDeliveryStatus}
                  onReportIssue={handleReportIssue}
                  onClaimOrder={handleClaimOrder}
                  isProcessing={processingId === delivery.id}
                  showDistance={false}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {deliveries.length === 0 && (
            <Card>
              <CardContent className="text-center py-16">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-lg font-medium text-gray-600 mb-2">
                  {filter === "pending"
                    ? "No active deliveries"
                    : filter === "delivered"
                    ? "No completed deliveries"
                    : "No deliveries found"}
                </p>
                <p className="text-sm text-gray-500">
                  Check back later or try a different filter
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Failed Delivery Modal */}
      <FailedDeliveryModal
        isOpen={failedDeliveryModal.isOpen}
        onClose={() => setFailedDeliveryModal({ isOpen: false, deliveryId: null, orderNumber: "" })}
        onSubmit={handleFailedDeliverySubmit}
        orderNumber={failedDeliveryModal.orderNumber}
      />
    </div>
  )
}
