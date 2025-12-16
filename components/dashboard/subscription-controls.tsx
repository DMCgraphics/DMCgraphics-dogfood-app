"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Pause, Play } from "lucide-react"
import { useState } from "react"
import { getPackPortion } from "@/lib/pack-portioning"

interface SubscriptionControlsProps {
  subscriptionStatus: "active" | "paused" | "cancelled"
  nextDelivery: string
  onPauseResume: () => void
  onSkipDelivery: (deliveryId: string) => void
  onManageSubscription: () => void
  dogName?: string
}

export function SubscriptionControls({
  subscriptionStatus,
  nextDelivery,
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

        <div className="pt-4 text-center">
          <div className="text-sm text-muted-foreground">Delivery every 2 weeks • Free shipping • Cancel anytime</div>
          <div className="text-xs text-muted-foreground mt-1">
            {packInfo.packsPerMonth} × {packInfo.packSize}g packs per month
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
