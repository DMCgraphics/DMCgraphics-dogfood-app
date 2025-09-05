"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, CreditCard, Package, Pause, Play, Settings, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"

interface SubscriptionManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubscriptionManagementModal({ open, onOpenChange }: SubscriptionManagementModalProps) {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open && user) {
      fetchSubscriptions()
    }
  }, [open, user])

  const fetchSubscriptions = async () => {
    try {
      const { data: subscriptionsData } = await supabase
        .from("subscriptions")
        .select(`
          *,
          plans (
            *,
            dogs (name, breed, weight),
            plan_items (
              *,
              recipes (name)
            )
          )
        `)
        .eq("user_id", user.id)
        .in("status", ["active", "trialing", "past_due", "paused"])

      setSubscriptions(subscriptionsData || [])
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePauseSubscription = async (subscriptionId: string) => {
    try {
      const response = await fetch("/api/subscriptions/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      })

      if (response.ok) {
        fetchSubscriptions() // Refresh data
      } else {
        alert("Failed to pause subscription")
      }
    } catch (error) {
      console.error("Error pausing subscription:", error)
      alert("Failed to pause subscription")
    }
  }

  const handleResumeSubscription = async (subscriptionId: string) => {
    try {
      const response = await fetch("/api/subscriptions/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      })

      if (response.ok) {
        fetchSubscriptions() // Refresh data
      } else {
        alert("Failed to resume subscription")
      }
    } catch (error) {
      console.error("Error resuming subscription:", error)
      alert("Failed to resume subscription")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      case "past_due":
        return "bg-red-100 text-red-800"
      case "trialing":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const calculateNextDelivery = (createdAt: string) => {
    const subscriptionDate = new Date(createdAt)
    const nextDeliveryDate = new Date(subscriptionDate)
    nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 7)
    return nextDeliveryDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manage Subscriptions
          </DialogTitle>
          <DialogDescription>
            View and manage your active subscriptions, pause deliveries, or modify your plans.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Subscriptions</h3>
            <p className="text-muted-foreground mb-4">You don't have any active subscriptions yet.</p>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {subscriptions.map((subscription) => (
              <Card key={subscription.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {subscription.plans?.dogs?.name || "Unknown Dog"}
                        <Badge className={getStatusColor(subscription.status)}>{subscription.status}</Badge>
                      </CardTitle>
                      <CardDescription>
                        {subscription.plans?.dogs?.breed} • {subscription.plans?.dogs?.weight} lbs
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Stripe ID</div>
                      <div className="font-mono text-xs">{subscription.stripe_subscription_id}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4" />
                        <span className="font-medium">Recipe:</span>
                        <span>{subscription.plans?.plan_items?.[0]?.recipes?.name || "No recipe selected"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Next Delivery:</span>
                        <span>{calculateNextDelivery(subscription.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4" />
                        <span className="font-medium">Billing:</span>
                        <span>Weekly</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-wrap gap-2">
                    {subscription.status === "active" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePauseSubscription(subscription.stripe_subscription_id)}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause Subscription
                      </Button>
                    ) : subscription.status === "paused" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResumeSubscription(subscription.stripe_subscription_id)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Resume Subscription
                      </Button>
                    ) : null}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alert("Skip next delivery - functionality coming soon")}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Skip Next Delivery
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alert("Modify plan - functionality coming soon")}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Modify Plan
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 bg-transparent"
                      onClick={() => alert("Cancel subscription - functionality coming soon")}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Cancel Subscription
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
