"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Package, Pause, Play, Settings, Truck } from "lucide-react"
import { useState } from "react"
import { getPackPortion } from "@/lib/pack-portioning"

interface Delivery {
  id: string
  date: string
  status: "upcoming" | "shipped" | "delivered"
  items: string[]
  trackingNumber?: string
}

interface SubscriptionControlsProps {
  subscriptionStatus: "active" | "paused" | "cancelled"
  nextDelivery: string
  deliveries: Delivery[]
  onPauseResume: () => void
  onSkipDelivery: (deliveryId: string) => void
  onManageSubscription: () => void
  dogName?: string
}

export function SubscriptionControls({
  subscriptionStatus,
  nextDelivery,
  deliveries,
  onPauseResume,
  onSkipDelivery,
  onManageSubscription,
  dogName,
}: SubscriptionControlsProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const sampleDailyGrams = 160
  const packInfo = getPackPortion(sampleDailyGrams)
  const biweeklyPacks = Math.ceil((packInfo.packsPerMonth / 30) * 14)

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
      case "upcoming":
        return "bg-blue-500 text-white"
      case "shipped":
        return "bg-orange-500 text-white"
      case "delivered":
        return "bg-primary text-primary-foreground"
      default:
        return "bg-muted text-muted-foreground"
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
            {deliveries.slice(0, 3).map((delivery) => (
              <div key={delivery.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{new Date(delivery.date).toLocaleDateString()}</div>
                    <div className="text-xs text-muted-foreground">{delivery.items.join(", ")}</div>
                    <div className="text-xs text-muted-foreground">
                      {biweeklyPacks} × {packInfo.packSize}g packs
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {delivery.trackingNumber && delivery.status === "shipped" && (
                    <Button variant="ghost" size="sm" className="text-xs">
                      <Truck className="h-3 w-3 mr-1" />
                      Track
                    </Button>
                  )}
                  <Badge className={getDeliveryStatusColor(delivery.status)} variant="secondary">
                    {delivery.status}
                  </Badge>
                </div>
              </div>
            ))}
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
