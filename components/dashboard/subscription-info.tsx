"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Package, Settings, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"

interface Subscription {
  id: string
  status: string
  billing_cycle: string
  current_period_end: string
  plan_id: string
  metadata: any
}

export function SubscriptionInfo() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchSubscription() {
      if (!user) return

      try {
        setIsLoading(true)

        // Fetch non-topper subscriptions (regular meal subscriptions)
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .in("status", ["active", "trialing", "past_due", "paused"])
          .is("metadata->>product_type", null) // Exclude topper subscriptions
          .single()

        if (error && error.code !== "PGRST116") {
          // PGRST116 is "no rows returned" which is fine
          console.error("Error fetching subscription:", error)
          return
        }

        setSubscription(data)
      } catch (error) {
        console.error("Error in fetchSubscription:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscription()
  }, [user])

  // Don't render if loading or no subscription
  if (isLoading || !subscription) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "trialing":
        return "bg-green-100 text-green-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      case "past_due":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getBillingCycleLabel = (cycle: string) => {
    switch (cycle) {
      case "weekly":
        return "Weekly"
      case "bi-weekly":
      case "biweekly":
        return "Bi-weekly"
      case "monthly":
        return "Monthly"
      default:
        return cycle
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Meal Subscription</CardTitle>
          <Badge className={getStatusColor(subscription.status)}>
            {subscription.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-primary/5 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium">Next Delivery</span>
            </div>
            <span className="text-sm font-bold">
              {new Date(subscription.current_period_end).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {getBillingCycleLabel(subscription.billing_cycle)} deliveries
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <a href="/subscription/manage">
              <Settings className="h-4 w-4 mr-2" />
              Manage Subscription
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
