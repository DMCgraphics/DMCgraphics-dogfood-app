"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Truck, Package, ArrowLeft, CheckCircle, Clock, MapPin, Loader2, AlertCircle, Play } from "lucide-react"
import Link from "next/link"

interface Delivery {
  id: string
  user_id: string
  scheduled_date: string
  status: string
  driver_notes: string | null
  delivery_address_line1: string | null
  delivery_address_line2: string | null
  delivery_city: string | null
  delivery_state: string | null
  delivery_zipcode: string | null
  items: any[]
  plans: {
    id: string
    dog_id: string
    delivery_zipcode: string
    dogs: { name: string; breed: string } | null
    plan_items: Array<{
      id: string
      qty: number
      size_g: number
      recipes: { name: string; slug: string } | null
    }>
  } | null
  profiles: {
    full_name: string | null
    email: string | null
    phone: string | null
  } | null
}

export default function DeliveryPage() {
  const router = useRouter()
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "pending" | "delivered">("pending")

  useEffect(() => {
    fetchDeliveries()
  }, [filter])

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

  function getStatusBadge(status: string) {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
      case "preparing":
        return <Badge className="bg-yellow-100 text-yellow-800">Preparing</Badge>
      case "out_for_delivery":
        return <Badge className="bg-orange-100 text-orange-800">Out for Delivery</Badge>
      case "delivered":
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  function getNextStatus(currentStatus: string): string | null {
    switch (currentStatus) {
      case "scheduled":
        return "preparing"
      case "preparing":
        return "out_for_delivery"
      case "out_for_delivery":
        return "delivered"
      default:
        return null
    }
  }

  function getNextStatusLabel(currentStatus: string): string {
    switch (currentStatus) {
      case "scheduled":
        return "Start Preparing"
      case "preparing":
        return "Mark Out for Delivery"
      case "out_for_delivery":
        return "Mark Delivered"
      default:
        return ""
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium">{error}</p>
            <Button className="mt-4" onClick={() => router.push("/")}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Truck className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold">Delivery Management</h1>
                  <p className="text-gray-600 mt-1">
                    {isLoading ? "Loading..." : `${deliveries.length} deliveries`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filter === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("pending")}
                >
                  Pending
                </Button>
                <Button
                  variant={filter === "delivered" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("delivered")}
                >
                  Completed
                </Button>
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  All
                </Button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-lg">Loading deliveries...</span>
            </div>
          ) : (
            <>
              {/* Deliveries List */}
              <div className="grid gap-4">
                {deliveries.map((delivery) => {
                  const dog = delivery.plans?.dogs
                  const customer = delivery.profiles
                  const planItems = delivery.plans?.plan_items || []
                  const nextStatus = getNextStatus(delivery.status)
                  const isProcessing = processingId === delivery.id

                  return (
                    <Card key={delivery.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Package className="h-5 w-5" />
                              Delivery for {dog?.name || "Unknown Dog"}
                            </CardTitle>
                            <CardDescription className="mt-2">
                              Customer: {customer?.full_name || "Unknown"} ({customer?.email || "No email"})
                              {customer?.phone && <span className="ml-2">• {customer.phone}</span>}
                            </CardDescription>
                          </div>
                          {getStatusBadge(delivery.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Delivery Details */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <div className="text-sm text-gray-600 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Scheduled Date
                              </div>
                              <div className="font-medium">
                                {new Date(delivery.scheduled_date).toLocaleDateString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                Delivery Address
                              </div>
                              <div className="text-sm">
                                {delivery.delivery_address_line1 || delivery.plans?.delivery_zipcode || "Not set"}
                                {delivery.delivery_address_line2 && (
                                  <div className="text-xs text-gray-500">
                                    {delivery.delivery_address_line2}
                                  </div>
                                )}
                                {delivery.delivery_city && (
                                  <div className="text-xs text-gray-500">
                                    {delivery.delivery_city}, {delivery.delivery_state} {delivery.delivery_zipcode}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Dog Breed</div>
                              <div className="text-sm font-medium">
                                {dog?.breed || "Unknown breed"}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">ZIP Code</div>
                              <div className="text-lg font-bold">
                                {delivery.delivery_zipcode || delivery.plans?.delivery_zipcode || "N/A"}
                              </div>
                            </div>
                          </div>

                          {/* Items */}
                          {planItems.length > 0 && (
                            <div className="border-t pt-4">
                              <div className="text-sm font-medium mb-2">Items to Deliver:</div>
                              <div className="space-y-1">
                                {planItems.map((item) => (
                                  <div key={item.id} className="text-sm text-gray-600 flex justify-between">
                                    <span>• {item.recipes?.name || "Unknown item"}</span>
                                    <span className="font-medium">
                                      {item.qty} × {item.size_g}g
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Driver Notes */}
                          {delivery.driver_notes && (
                            <div className="border-t pt-4">
                              <div className="text-sm font-medium mb-1">Driver Notes:</div>
                              <p className="text-sm text-gray-600">{delivery.driver_notes}</p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          {nextStatus && (
                            <div className="border-t pt-4 flex gap-2">
                              <Button
                                onClick={() => updateDeliveryStatus(delivery.id, nextStatus)}
                                disabled={isProcessing}
                                className="flex-1"
                              >
                                {isProcessing ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Updating...
                                  </>
                                ) : (
                                  <>
                                    {nextStatus === "delivered" ? (
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                    ) : (
                                      <Play className="h-4 w-4 mr-2" />
                                    )}
                                    {getNextStatusLabel(delivery.status)}
                                  </>
                                )}
                              </Button>
                              {delivery.status === "out_for_delivery" && (
                                <Button
                                  variant="destructive"
                                  onClick={() => {
                                    const notes = prompt("Enter reason for failed delivery:")
                                    if (notes) {
                                      updateDeliveryStatus(delivery.id, "failed", notes)
                                    }
                                  }}
                                  disabled={isProcessing}
                                >
                                  <AlertCircle className="h-4 w-4 mr-2" />
                                  Mark Failed
                                </Button>
                              )}
                            </div>
                          )}

                          {delivery.status === "delivered" && (
                            <div className="border-t pt-4">
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-5 w-5" />
                                <span className="font-medium">Delivery completed</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Empty State */}
              {deliveries.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {filter === "pending"
                        ? "No pending deliveries at this time"
                        : filter === "delivered"
                        ? "No completed deliveries found"
                        : "No deliveries found"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
