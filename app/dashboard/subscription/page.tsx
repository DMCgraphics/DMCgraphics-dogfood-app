"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Package, Pause, Play, Settings } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"

export default function SubscriptionManagementPage() {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data: subscriptionsData, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("[v0] Error fetching subscriptions:", error.message)
          setSubscriptions([])
        } else {
          const enrichedSubscriptions = []

          for (const subscription of subscriptionsData || []) {
            let planData = null
            let dogData = null

            if (subscription.metadata && subscription.metadata.plan_id) {
              // Get plan data
              const { data: plan } = await supabase
                .from("plans")
                .select(`
                  *,
                  plan_items (
                    *,
                    recipes (name)
                  )
                `)
                .eq("id", subscription.metadata.plan_id)
                .single()

              if (plan) {
                planData = plan

                // Get dog data
                const { data: dog } = await supabase.from("dogs").select("*").eq("id", plan.dog_id).single()

                if (dog) {
                  dogData = dog
                }
              }
            }

            enrichedSubscriptions.push({
              ...subscription,
              planData,
              dogData,
            })
          }

          setSubscriptions(enrichedSubscriptions)
        }
      } catch (error) {
        console.error("[v0] Error in fetchSubscriptions:", error)
        setSubscriptions([])
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptions()
  }, [user])

  const handlePauseSubscription = async (subscriptionId: string) => {
    try {
      const response = await fetch("/api/subscriptions/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_id: subscriptionId }),
      })

      if (response.ok) {
        // Refresh subscriptions
        window.location.reload()
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
        body: JSON.stringify({ subscription_id: subscriptionId }),
      })

      if (response.ok) {
        // Refresh subscriptions
        window.location.reload()
      } else {
        alert("Failed to resume subscription")
      }
    } catch (error) {
      console.error("Error resuming subscription:", error)
      alert("Failed to resume subscription")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your subscriptions...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container py-8">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="font-manrope text-2xl lg:text-3xl font-bold">Subscription Management</h1>
              <p className="text-muted-foreground">Manage your active subscriptions and delivery schedules</p>
            </div>
          </div>

          <div className="space-y-6">
            {subscriptions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Subscriptions</h3>
                  <p className="text-muted-foreground mb-4">
                    You don't have any active subscriptions yet. Start by building a plan for your dog.
                  </p>
                  <Link href="/plan-builder">
                    <Button>Build Your Dog's Plan</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              subscriptions.map((subscription) => {
                const planData = subscription.planData
                const dogData = subscription.dogData
                const planItem = planData?.plan_items?.[0]
                const recipeName = planItem?.recipes?.name || "Custom Recipe"

                const nextDeliveryDate = new Date(subscription.created_at)
                nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 7)

                return (
                  <Card key={subscription.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {dogData?.name || "Unknown Dog"}'s Subscription
                            <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                              {subscription.status}
                            </Badge>
                          </CardTitle>
                          <CardDescription>{recipeName} • Weekly Delivery</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {subscription.status === "active" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePauseSubscription(subscription.stripe_subscription_id)}
                            >
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResumeSubscription(subscription.stripe_subscription_id)}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Resume
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Next Delivery</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {nextDeliveryDate.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Dog Details</h4>
                          <p className="text-sm text-muted-foreground">
                            {dogData?.breed || "Unknown breed"} • {dogData?.age || "Unknown age"} years old
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Plan Weight</h4>
                          <p className="text-sm text-muted-foreground">
                            {planData?.target_weight ? Math.round(planData.target_weight * 2.20462) : "Unknown"} lbs
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}
