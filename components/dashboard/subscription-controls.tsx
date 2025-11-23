"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Package, Pause, Play, Settings, Truck, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { getPackPortion } from "@/lib/pack-portioning"

interface Delivery {
  id: string
  date: string
  status: "scheduled" | "preparing" | "out_for_delivery" | "delivered" | "failed" | "cancelled"
  items: string[]
  trackingNumber?: string
}

interface SubscriptionControlsProps {
  subscriptionStatus: "active" | "paused" | "cancelled"
  nextDelivery: string
  deliveries?: Delivery[]
  onPauseResume: () => void
  onSkipDelivery: (deliveryId: string) => void
  onManageSubscription: () => void
  dogName?: string
}

export function SubscriptionControls({
  subscriptionStatus,
  nextDelivery,
  deliveries: propDeliveries,
  onPauseResume,
  onSkipDelivery,
  onManageSubscription,
  dogName,
}: SubscriptionControlsProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [deliveries, setDeliveries] = useState<Delivery[]>(propDeliveries || [])
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(!propDeliveries)

  const sampleDailyGrams = 160
  const packInfo = getPackPortion(sampleDailyGrams)
  const biweeklyPacks = Math.ceil((packInfo.packsPerMonth / 30) * 14)

  // Fetch real deliveries from API
  useEffect(() => {
    if (propDeliveries) {
      setDeliveries(propDeliveries)
      return
    }

    async function fetchDeliveries() {
      try {
        const response = await fetch('/api/deliveries?limit=5')
        if (response.ok) {
          const data = await response.json()
          const formattedDeliveries = data.deliveries?.map((d: any) => ({
            id: d.id,
            date: d.scheduled_date,
            status: d.status,
            items: d.items || [],
            trackingNumber: d.tracking_number,
          })) || []
          setDeliveries(formattedDeliveries)
        }
      } catch (error) {
        console.error("Error fetching deliveries:", error)
      } finally {
        setIsLoadingDeliveries(false)
      }
    }

    fetchDeliveries()
  }, [propDeliveries])

  const handlePauseResume = async () => {
    setIsProcessing(true)
    setTimeout(() => {
      onPauseResume()
      setIsProcessing(false)
    }, 1000)
  }

  const handleManageClick = () => {
    onManageSubscription()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-primary text-primary-foreground"
      case "paused":
        return "bg-orange-500 text-white"
      case "cancelled":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500 text-white"
      case "preparing":
        return "bg-yellow-500 text-white"
      case "out_for_delivery":
        return "bg-orange-500 text-white"
      case "delivered":
        return "bg-primary text-primary-foreground"
      case "failed":
        return "bg-red-500 text-white"
      case "cancelled":
        return "bg-gray-500 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getDeliveryStatusLabel = (status: string) => {
    switch (status) {
      case "scheduled":
        return "upcoming"
      case "preparing":
        return "preparing"
      case "out_for_delivery":
        return "out for delivery"
      case "delivered":
        return "delivered"
      case "failed":
        return "failed"
      case "cancelled":
        return "cancelled"
      default:
        return status
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{dogName ? `${dogName}'s Subscription` : "Subscription & Deliveries"}</CardTitle>
          <Badge className={getStatusColor(subscriptionStatus)} variant="secondary">
            {subscriptionStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-primary/5 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium">Next Delivery</span>
            </div>
            <span className="text-sm font-bold">{nextDelivery}</span>
          </div>
          <div className="text-sm text-muted-foreground mb-3">
            {biweeklyPacks} × {packInfo.packSize}g packs ({biweeklyPacks * packInfo.packSize}g total)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSkipDelivery("next")}
              className="bg-transparent"
              disabled={subscriptionStatus !== "active"}
            >
              Skip This Delivery
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePauseResume}
              disabled={isProcessing || subscriptionStatus === "cancelled"}
              className="bg-transparent"
            >
              {isProcessing ? (
                "Processing..."
              ) : subscriptionStatus === "paused" ? (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-3 w-3 mr-1" />
                  Pause
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Recent Deliveries</span>
            <Button variant="ghost" size="sm" onClick={handleManageClick}>
              <Settings className="h-4 w-4 mr-1" />
              Manage
            </Button>
          </div>

          <div className="space-y-2">
            {isLoadingDeliveries ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading deliveries...</span>
              </div>
            ) : deliveries.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No deliveries yet
              </div>
            ) : (
              deliveries.slice(0, 3).map((delivery) => (
                <div key={delivery.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{new Date(delivery.date).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {Array.isArray(delivery.items) && delivery.items.length > 0
                          ? delivery.items.join(", ")
                          : `${biweeklyPacks} × ${packInfo.packSize}g packs`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {delivery.trackingNumber && delivery.status === "out_for_delivery" && (
                      <Button variant="ghost" size="sm" className="text-xs">
                        <Truck className="h-3 w-3 mr-1" />
                        Track
                      </Button>
                    )}
                    <Badge className={getDeliveryStatusColor(delivery.status)} variant="secondary">
                      {getDeliveryStatusLabel(delivery.status)}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-4 border-t text-center">
          <div className="text-sm text-muted-foreground">Delivery every 2 weeks • Free shipping • Cancel anytime</div>
          <div className="text-xs text-muted-foreground mt-1">
            {packInfo.packsPerMonth} × {packInfo.packSize}g packs per month
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
