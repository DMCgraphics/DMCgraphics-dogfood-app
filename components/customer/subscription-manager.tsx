"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, Pause, Play, Settings, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface SubscriptionAction {
  type: "pause" | "skip" | "modify" | "cancel"
  label: string
  description: string
  icon: React.ReactNode
}

export function SubscriptionManager() {
  const { user } = useAuth()
  const [subscriptionStatus, setSubscriptionStatus] = useState<"active" | "paused">("active")
  const [nextDelivery] = useState(new Date("2024-12-15"))
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)

  const actions: SubscriptionAction[] = [
    {
      type: "pause",
      label: "Pause Subscription",
      description: "Temporarily pause deliveries for up to 3 months",
      icon: <Pause className="h-4 w-4" />,
    },
    {
      type: "skip",
      label: "Skip Next Delivery",
      description: "Skip your next delivery and resume the following month",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      type: "modify",
      label: "Modify Plan",
      description: "Change recipes, portions, or delivery frequency",
      icon: <Settings className="h-4 w-4" />,
    },
  ]

  const handleSubscriptionAction = (actionType: string) => {
    console.log("[v0] subscription_action", { actionType })

    switch (actionType) {
      case "pause":
        setSubscriptionStatus("paused")
        alert("Subscription paused. You can resume anytime from your dashboard.")
        break
      case "skip":
        alert("Next delivery skipped. Your following delivery will be January 15th.")
        break
      case "modify":
        alert("Redirecting to plan builder to modify your subscription...")
        break
    }

    setIsDialogOpen(false)
    setSelectedAction(null)
  }

  const handleResumeSubscription = () => {
    setSubscriptionStatus("active")
    console.log("[v0] subscription_resumed")
    alert("Subscription resumed! Your next delivery is scheduled.")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Subscription Management</span>
            <Badge variant={subscriptionStatus === "active" ? "default" : "secondary"}>
              {subscriptionStatus === "active" ? "Active" : "Paused"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscriptionStatus === "active" ? (
            <>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Next Delivery</span>
                </div>
                <p className="text-green-600 dark:text-green-400">
                  {nextDelivery.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {actions.map((action) => (
                  <Card key={action.type} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <Dialog open={isDialogOpen && selectedAction === action.type} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <div onClick={() => setSelectedAction(action.type)}>
                            <div className="flex items-center gap-2 mb-2">
                              {action.icon}
                              <span className="font-medium">{action.label}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                          </div>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{action.label}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p>{action.description}</p>
                            <div className="flex gap-2">
                              <Button onClick={() => handleSubscriptionAction(action.type)}>Confirm</Button>
                              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Subscription Paused</span>
              </div>
              <p className="text-amber-600 dark:text-amber-400 mb-4">
                Your subscription is currently paused. No deliveries are scheduled.
              </p>
              <Button onClick={handleResumeSubscription}>
                <Play className="h-4 w-4 mr-2" />
                Resume Subscription
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
