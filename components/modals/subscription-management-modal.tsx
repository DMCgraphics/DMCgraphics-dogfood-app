"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, CreditCard, Package, Pause, Play, Plus, Settings, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

interface SubscriptionManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubscriptionManagementModal({ open, onOpenChange }: SubscriptionManagementModalProps) {
  const { user, refreshSubscriptionStatus } = useAuth()
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState([])
  const [dogsWithoutSubscriptions, setDogsWithoutSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<string | null>(null)

  useEffect(() => {
    if (open && user) {
      fetchSubscriptions()
    }
  }, [open, user])

  const fetchSubscriptions = async () => {
    try {
      console.log("[v0] Modal - Fetching subscriptions for user:", user.id, user.email)

      // First, get all subscriptions for the user
      const { data: subscriptionsData, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing", "past_due", "paused", "canceled"])
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching subscriptions:", error)
        setSubscriptions([])
        return
      }

      console.log("[v0] Modal - Raw subscriptions data:", subscriptionsData)
      console.log("[v0] Modal - Number of subscriptions found:", subscriptionsData?.length)

      // If no subscriptions found, check for active plans without subscriptions
      if (!subscriptionsData || subscriptionsData.length === 0) {
        const { data: plansData, error: plansError } = await supabase
          .from("plans")
          .select(`
            *,
            plan_items (
              *,
              recipes (name)
            )
          `)
          .eq("user_id", user.id)
          .in("status", ["active", "checkout_in_progress"])
          .order("created_at", { ascending: false })

        if (plansError) {
          console.error("Error fetching plans:", plansError)
          setSubscriptions([])
          return
        }

        console.log("[v0] Modal - Found plans without subscriptions:", plansData)

        // Convert plans to subscription-like format
        const planSubscriptions = []
        for (const plan of plansData || []) {
          let dogData = null
          if (plan.dog_id) {
            const { data: dog } = await supabase
              .from("dogs")
              .select("*")
              .eq("id", plan.dog_id)
              .single()
            if (dog) {
              dogData = dog
            }
          }

          planSubscriptions.push({
            id: plan.id,
            user_id: plan.user_id,
            plan_id: plan.id,
            status: plan.status === "active" ? "active" : "pending",
            created_at: plan.created_at,
            current_period_end: null,
            stripe_subscription_id: null,
            planData: plan,
            dogData,
          })
        }

        setSubscriptions(planSubscriptions)
        await refreshSubscriptionStatus()
        setLoading(false)
        return
      }

      // Enrich each subscription with plan and dog data
      const enrichedSubscriptions = []
      
      for (const subscription of subscriptionsData || []) {
        let planData = null
        let dogData = null

        // Get plan data using plan_id from subscription
        if (subscription.plan_id) {
          console.log("[v0] Modal - Fetching plan data for plan_id:", subscription.plan_id)

          const { data: plan, error: planError } = await supabase
            .from("plans")
            .select(`
              *,
              plan_items (
                *,
                recipes (name)
              )
            `)
            .eq("id", subscription.plan_id)
            .single()

          if (planError) {
            console.error("[v0] Modal - Error fetching plan:", planError)
          }

          if (plan) {
            console.log("[v0] Modal - Plan data fetched:", plan)
            console.log("[v0] Modal - plan_items count:", plan.plan_items?.length)
            console.log("[v0] Modal - plan_items details:", plan.plan_items)
            planData = plan

            // Get dog data using dog_id from plan
            const { data: dog } = await supabase
              .from("dogs")
              .select("*")
              .eq("id", plan.dog_id)
              .single()

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

      console.log("[v0] Modal - Enriched subscriptions:", enrichedSubscriptions)

      // Debug logging for plan items
      enrichedSubscriptions.forEach((sub, idx) => {
        console.log(`[v0] Subscription ${idx} - plan_items count:`, sub.planData?.plan_items?.length)
        console.log(`[v0] Subscription ${idx} - plan_items:`, sub.planData?.plan_items)
      })

      // Update status to "canceled" if cancel_at_period_end is true
      enrichedSubscriptions.forEach(sub => {
        if (sub.cancel_at_period_end && sub.status === "active") {
          sub.status = "canceled"
          console.log("[v0] Modal - Subscription marked as canceled due to cancel_at_period_end:", sub.id)
        }
      })

      // Filter to show only the most recent subscription per dog to avoid confusion from test data
      const subscriptionsByDog = new Map()
      enrichedSubscriptions.forEach(sub => {
        const dogId = sub.planData?.dog_id
        if (dogId && !subscriptionsByDog.has(dogId)) {
          subscriptionsByDog.set(dogId, sub)
        }
      })
      const uniqueSubscriptions = Array.from(subscriptionsByDog.values())

      console.log("[v0] Modal - Showing unique subscriptions (most recent per dog):", uniqueSubscriptions.length)

      setSubscriptions(uniqueSubscriptions)

      // Fetch all dogs to find those without subscriptions
      const { data: allDogs, error: dogsError } = await supabase
        .from("dogs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (!dogsError && allDogs) {
        // Find dogs that don't have subscriptions
        const dogsWithSubs = new Set(uniqueSubscriptions.map(sub => sub.planData?.dog_id).filter(Boolean))
        const dogsWithoutSubs = allDogs.filter(dog => !dogsWithSubs.has(dog.id))
        console.log("[v0] Modal - Dogs without subscriptions:", dogsWithoutSubs.length)
        setDogsWithoutSubscriptions(dogsWithoutSubs)
      }

      // Refresh auth context subscription status to ensure consistency
      await refreshSubscriptionStatus()
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
      setSubscriptions([])
      setDogsWithoutSubscriptions([])
    } finally {
      setLoading(false)
    }
  }

  const handlePauseSubscription = async (subscriptionId: string) => {
    try {
      if (!subscriptionId) {
        console.error("[v0] Modal - No subscription ID provided to pause")
        alert("Cannot pause subscription: No subscription ID found")
        return
      }

      console.log("[v0] Modal - Pausing subscription:", subscriptionId)
      const response = await fetch("/api/subscriptions/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_id: subscriptionId }),
      })

      if (response.ok) {
        console.log("[v0] Modal - Subscription paused successfully")
        await fetchSubscriptions() // Refresh data
        await refreshSubscriptionStatus() // Update auth context
      } else {
        const errorText = await response.text()
        console.error("[v0] Modal - Failed to pause subscription:", errorText)
        alert("Failed to pause subscription")
      }
    } catch (error) {
      console.error("Error pausing subscription:", error)
      alert("Failed to pause subscription")
    }
  }

  const handleResumeSubscription = async (subscriptionId: string) => {
    try {
      if (!subscriptionId) {
        console.error("[v0] Modal - No subscription ID provided to resume")
        alert("Cannot resume subscription: No subscription ID found")
        return
      }

      console.log("[v0] Modal - Resuming subscription:", subscriptionId)
      const response = await fetch("/api/subscriptions/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_id: subscriptionId }),
      })

      if (response.ok) {
        console.log("[v0] Modal - Subscription resumed successfully")
        await fetchSubscriptions() // Refresh data
        await refreshSubscriptionStatus() // Update auth context
      } else {
        const errorText = await response.text()
        console.error("[v0] Modal - Failed to resume subscription:", errorText)
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
      case "canceled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const calculateNextDelivery = (subscription: any) => {
    // Use current_period_end if available, otherwise calculate from created_at
    if (subscription.current_period_end) {
      const nextDeliveryDate = new Date(subscription.current_period_end)
      return nextDeliveryDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } else {
      // Fallback to calculating from created_at
      const subscriptionDate = new Date(subscription.created_at)
      const nextDeliveryDate = new Date(subscriptionDate)
      nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 7)
      return nextDeliveryDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    }
  }

  const handleCancelSubscription = async () => {
    if (!subscriptionToCancel) return

    try {
      console.log("[v0] Canceling subscription:", subscriptionToCancel)

      const response = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_id: subscriptionToCancel }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to cancel subscription")
      }

      console.log("[v0] Subscription canceled successfully")

      // Close confirmation dialog
      setShowCancelConfirm(false)
      setSubscriptionToCancel(null)

      // Refresh subscriptions
      await fetchSubscriptions()
      await refreshSubscriptionStatus()

      alert("Subscription canceled successfully. You'll continue to have access until the end of your billing period.")
    } catch (error: any) {
      console.error("[v0] Error canceling subscription:", error)
      alert(`Failed to cancel subscription: ${error.message}`)
      setShowCancelConfirm(false)
      setSubscriptionToCancel(null)
    }
  }

  const handleReactivateSubscription = async (subscriptionId: string) => {
    try {
      if (!subscriptionId) {
        console.error("[v0] Modal - No subscription ID provided to reactivate")
        alert("Cannot reactivate subscription: No subscription ID found")
        return
      }

      console.log("[v0] Modal - Reactivating subscription:", subscriptionId)
      const response = await fetch("/api/subscriptions/reactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_id: subscriptionId }),
      })

      if (response.ok) {
        console.log("[v0] Modal - Subscription reactivated successfully")
        await fetchSubscriptions() // Refresh data
        await refreshSubscriptionStatus() // Update auth context
        alert("Subscription reactivated successfully!")
      } else {
        const errorText = await response.text()
        console.error("[v0] Modal - Failed to reactivate subscription:", errorText)
        alert("Failed to reactivate subscription")
      }
    } catch (error) {
      console.error("Error reactivating subscription:", error)
      alert("Failed to reactivate subscription")
    }
  }

  const handleModifyPlan = async (subscription: any) => {
    try {
      console.log("[v0] Modifying plan for subscription:", subscription.id)

      // Close the modal
      onOpenChange(false)

      // Navigate to plan builder with query params instead of localStorage
      const params = new URLSearchParams({
        modify: "true",
        subscription_id: subscription.id,
        plan_id: subscription.plan_id,
        stripe_subscription_id: subscription.stripe_subscription_id || "",
      })

      router.push(`/plan-builder?${params.toString()}`)
    } catch (error) {
      console.error("Error preparing to modify plan:", error)
      alert("Failed to load plan for modification. Please try again.")
    }
  }

  return (
    <>
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
            <div className="text-center py-4 border-b">
              <h3 className="text-lg font-semibold">Found {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}</h3>
              <p className="text-sm text-muted-foreground">Manage your active subscriptions below</p>
            </div>
            {subscriptions.map((subscription) => (
              <Card key={subscription.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {subscription.dogData?.name || "Unknown Dog"}
                        <Badge className={getStatusColor(subscription.status)}>{subscription.status}</Badge>
                      </CardTitle>
                      <CardDescription>
                        {subscription.dogData?.breed} • {subscription.dogData?.weight} lbs
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
                      <div className="flex items-start gap-2 text-sm">
                        <Package className="h-4 w-4 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-medium">Recipes:</span>
                          <div className="mt-1 space-y-1">
                            {subscription.planData?.plan_items && subscription.planData.plan_items.length > 0 ? (
                              subscription.planData.plan_items.map((item: any, idx: number) => (
                                <div key={idx} className="text-muted-foreground">
                                  • {item.recipes?.name || "Unknown recipe"}
                                </div>
                              ))
                            ) : (
                              <div className="text-muted-foreground">No recipes selected</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Next Delivery:</span>
                        <span>{calculateNextDelivery(subscription)}</span>
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
                    {!subscription.stripe_subscription_id ? (
                      <>
                        <div className="text-sm text-muted-foreground w-full mb-2">
                          No Stripe subscription found
                        </div>
                        {subscription.status === "pending" && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                onOpenChange(false)
                                router.push("/checkout")
                              }}
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Complete Checkout
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleModifyPlan(subscription)}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Modify Plan
                            </Button>
                          </>
                        )}
                      </>
                    ) : subscription.status === "canceled" ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleReactivateSubscription(subscription.stripe_subscription_id)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Resume Subscription
                      </Button>
                    ) : (
                      <>
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
                          onClick={() => handleModifyPlan(subscription)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Modify Plan
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 bg-transparent"
                          onClick={() => {
                            setSubscriptionToCancel(subscription.stripe_subscription_id)
                            setShowCancelConfirm(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Cancel Subscription
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Show dogs without subscriptions */}
            {dogsWithoutSubscriptions.length > 0 && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <div className="text-center py-2">
                    <h3 className="text-lg font-semibold">Dogs Without Subscriptions</h3>
                    <p className="text-sm text-muted-foreground">Create a meal plan for these dogs</p>
                  </div>
                  {dogsWithoutSubscriptions.map((dog: any) => (
                    <Card key={dog.id}>
                      <CardHeader>
                        <CardTitle>{dog.name}</CardTitle>
                        <CardDescription>
                          {dog.breed} • {dog.weight} {dog.weight_unit || "lbs"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => {
                            onOpenChange(false)
                            router.push(`/plan-builder?dog_id=${dog.id}`)
                          }}
                          className="w-full sm:w-auto"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Subscription Plan
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Cancel Confirmation Dialog */}
    <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Cancel Subscription
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this subscription? You'll continue to have access until the end of your current billing period.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => {
              setShowCancelConfirm(false)
              setSubscriptionToCancel(null)
            }}
          >
            No, Keep Subscription
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancelSubscription}
          >
            Yes, Cancel Subscription
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
