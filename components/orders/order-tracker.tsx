"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  Phone,
  Mail,
  ExternalLink,
  RefreshCw,
} from "lucide-react"

interface TrackingEvent {
  id: string
  timestamp: string
  status: string
  location: string
  description: string
  isCompleted: boolean
}

interface OrderTrackingData {
  orderId: string
  trackingNumber: string
  status: "processing" | "shipped" | "out-for-delivery" | "delivered" | "exception"
  estimatedDelivery: string
  actualDelivery?: string
  carrier: string
  progress: number
  events: TrackingEvent[]
  deliveryAddress: {
    name: string
    street: string
    city: string
    state: string
    zip: string
  }
}

interface OrderTrackerProps {
  orderId: string
  trackingNumber?: string
}

export function OrderTracker({ orderId, trackingNumber }: OrderTrackerProps) {
  const [trackingData, setTrackingData] = useState<OrderTrackingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Mock tracking data - in real app this would come from API
  const mockTrackingData: OrderTrackingData = {
    orderId,
    trackingNumber: trackingNumber || "1Z999AA1234567890",
    status: "shipped",
    estimatedDelivery: "2024-12-20",
    carrier: "UPS",
    progress: 65,
    events: [
      {
        id: "1",
        timestamp: "2024-12-15T10:00:00Z",
        status: "Order Placed",
        location: "NouriPet Fulfillment Center",
        description: "Your order has been received and is being prepared",
        isCompleted: true,
      },
      {
        id: "2",
        timestamp: "2024-12-16T14:30:00Z",
        status: "Processing",
        location: "NouriPet Fulfillment Center",
        description: "Fresh meals are being prepared for your dog",
        isCompleted: true,
      },
      {
        id: "3",
        timestamp: "2024-12-17T09:15:00Z",
        status: "Shipped",
        location: "Hartford, CT",
        description: "Package has been picked up by carrier",
        isCompleted: true,
      },
      {
        id: "4",
        timestamp: "2024-12-18T16:45:00Z",
        status: "In Transit",
        location: "Springfield, MA",
        description: "Package is on its way to the destination",
        isCompleted: true,
      },
      {
        id: "5",
        timestamp: "",
        status: "Out for Delivery",
        location: "Local Delivery Facility",
        description: "Package is out for delivery",
        isCompleted: false,
      },
      {
        id: "6",
        timestamp: "",
        status: "Delivered",
        location: "Your Address",
        description: "Package has been delivered",
        isCompleted: false,
      },
    ],
    deliveryAddress: {
      name: "John Smith",
      street: "123 Main Street",
      city: "Boston",
      state: "MA",
      zip: "02101",
    },
  }

  useEffect(() => {
    const fetchTrackingData = async () => {
      setIsLoading(true)
      setError("")

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        if (!trackingNumber) {
          throw new Error("No tracking number provided")
        }

        setTrackingData(mockTrackingData)
        console.log("[v0] order_tracking_loaded", { orderId, trackingNumber })
      } catch (err: any) {
        setError(err.message || "Failed to load tracking information")
        console.log("[v0] order_tracking_error", { orderId, error: err.message })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrackingData()
  }, [orderId, trackingNumber])

  const handleRefresh = () => {
    setLastUpdated(new Date())
    // In real app, this would refetch data
    console.log("[v0] tracking_refresh_clicked", { orderId })
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "shipped":
      case "in transit":
      case "out for delivery":
        return <Truck className="h-5 w-5 text-blue-500" />
      case "processing":
        return <Package className="h-5 w-5 text-amber-500" />
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      case "shipped":
      case "out-for-delivery":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
      case "processing":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
      case "exception":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading tracking information...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!trackingData) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Tracking Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">Order Tracking</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Order: {trackingData.orderId}</span>
                <span>Tracking: {trackingData.trackingNumber}</span>
                <span>Carrier: {trackingData.carrier}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(trackingData.status)}>
                {getStatusIcon(trackingData.status)}
                <span className="ml-1 capitalize">{trackingData.status.replace("-", " ")}</span>
              </Badge>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Delivery Progress</span>
              <span>{trackingData.progress}%</span>
            </div>
            <Progress value={trackingData.progress} className="h-2" />
          </div>

          {/* Estimated Delivery */}
          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium">{trackingData.actualDelivery ? "Delivered" : "Estimated Delivery"}</span>
            </div>
            <span className="font-semibold">
              {trackingData.actualDelivery
                ? new Date(trackingData.actualDelivery).toLocaleDateString()
                : new Date(trackingData.estimatedDelivery).toLocaleDateString()}
            </span>
          </div>

          {/* Delivery Address */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                <div className="font-medium">{trackingData.deliveryAddress.name}</div>
                <div className="text-muted-foreground">
                  {trackingData.deliveryAddress.street}
                  <br />
                  {trackingData.deliveryAddress.city}, {trackingData.deliveryAddress.state}{" "}
                  {trackingData.deliveryAddress.zip}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Tracking History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trackingData.events.map((event, index) => (
              <div key={event.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      event.isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {event.isCompleted ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  </div>
                  {index < trackingData.events.length - 1 && (
                    <div className={`w-0.5 h-12 ${event.isCompleted ? "bg-primary" : "bg-muted"}`} />
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-medium ${event.isCompleted ? "" : "text-muted-foreground"}`}>
                      {event.status}
                    </h4>
                    {event.timestamp && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{event.description}</p>
                  {event.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start bg-transparent">
              <Phone className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            <Button variant="outline" className="justify-start bg-transparent">
              <Mail className="h-4 w-4 mr-2" />
              Email Updates
            </Button>
            <Button variant="outline" className="justify-start bg-transparent">
              <ExternalLink className="h-4 w-4 mr-2" />
              Track on {trackingData.carrier}
            </Button>
            <Button variant="outline" className="justify-start bg-transparent">
              <Package className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">Last updated: {lastUpdated.toLocaleString()}</div>
        </CardContent>
      </Card>
    </div>
  )
}
