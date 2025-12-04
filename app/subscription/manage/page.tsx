"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Package, CreditCard, Settings, Edit, Pause, Play, X, Plus, Minus, AlertTriangle } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"

interface DogSubscription {
  id: string
  dogId: string
  dogName: string
  planId: string
  status: "active" | "paused" | "cancelled"
  billingCycle: "weekly" | "monthly" | "quarterly"
  nextBillingDate: string
  priceMonthly: number
  currentRecipe: string
  mealsPerDay: number
  addOns: string[]
  deliveryFrequency: "weekly" | "biweekly" | "monthly"
  nextDeliveryDate: string
}

export default function SubscriptionManagePage() {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState<DogSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelFeedback, setCancelFeedback] = useState("")

  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data: subscriptionsData, error } = await supabase
          .from("subscriptions")
          .select(`
            *,
            plans (
              id,
              dog_id,
              plan_data
            )
          `)
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("[v0] Error fetching subscriptions:", error)
          setLoading(false)
          return
        }

        const transformedSubscriptions: DogSubscription[] =
          subscriptionsData?.map((sub) => ({
            id: sub.id,
            dogId: sub.plans?.dog_id || null,
            dogName: sub.plans?.dogs?.name || "Your Dog",
            planId: sub.plan_id,
            status: sub.status,
            billingCycle: sub.billing_cycle || sub.interval,
            nextBillingDate: sub.next_billing_date || sub.current_period_end,
            priceMonthly: sub.price_monthly || 0,
            currentRecipe: sub.plans?.plan_data?.selectedRecipe || "Fresh Food Pack",
            mealsPerDay: sub.plans?.plan_data?.mealsPerDay || 2,
            addOns: sub.plans?.plan_data?.selectedAddOns || [],
            deliveryFrequency: sub.interval_count === 2 ? "biweekly" : "weekly",
            nextDeliveryDate: sub.current_period_end || "2024-12-15",
          })) || []

        setSubscriptions(transformedSubscriptions)
        if (transformedSubscriptions.length > 0) {
          setSelectedSubscription(transformedSubscriptions[0].id)
        }
      } catch (error) {
        console.error("[v0] Error in fetchSubscriptions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptions()
  }, [user])

  const selectedSub = subscriptions.find((sub) => sub.id === selectedSubscription)

  const handlePauseResume = async (subscriptionId: string) => {
    const subscription = subscriptions.find((sub) => sub.id === subscriptionId)
    if (!subscription) return

    const newStatus = subscription.status === "active" ? "paused" : "active"

    try {
      const { error } = await supabase.from("subscriptions").update({ status: newStatus }).eq("id", subscriptionId)

      if (error) {
        console.error("[v0] Error updating subscription:", error)
        return
      }

      setSubscriptions((prev) => prev.map((sub) => (sub.id === subscriptionId ? { ...sub, status: newStatus } : sub)))
    } catch (error) {
      console.error("[v0] Error in handlePauseResume:", error)
    }
  }

  const handleCancelSubscription = async () => {
    if (!selectedSubscription) return

    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("id", selectedSubscription)

      if (error) {
        console.error("[v0] Error cancelling subscription:", error)
        return
      }

      setSubscriptions((prev) =>
        prev.map((sub) => (sub.id === selectedSubscription ? { ...sub, status: "cancelled" } : sub)),
      )
      setShowCancelModal(false)
      setCancelReason("")
      setCancelFeedback("")
    } catch (error) {
      console.error("[v0] Error in handleCancelSubscription:", error)
    }
  }

  const handleUpdateDeliveryFrequency = async (subscriptionId: string, frequency: string) => {
    setSubscriptions((prev) =>
      prev.map((sub) => (sub.id === subscriptionId ? { ...sub, deliveryFrequency: frequency as any } : sub)),
    )
  }

  const handleUpdateMealsPerDay = async (subscriptionId: string, meals: number) => {
    setSubscriptions((prev) => prev.map((sub) => (sub.id === subscriptionId ? { ...sub, mealsPerDay: meals } : sub)))
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

  if (subscriptions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardHeader>
                <CardTitle>No Active Subscriptions</CardTitle>
                <p className="text-muted-foreground">
                  You don't have any active subscriptions yet. Start by building a plan for your dog.
                </p>
              </CardHeader>
              <CardContent>
                <Button onClick={() => (window.location.href = "/plan-builder")}>Build Your Dog's Plan</Button>
              </CardContent>
            </Card>
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-manrope text-2xl lg:text-3xl font-bold">Manage Subscriptions</h1>
              <p className="text-muted-foreground">Manage your dogs' nutrition plans and delivery settings</p>
            </div>
            <Button onClick={() => (window.location.href = "/plan-builder")}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Plan
            </Button>
          </div>

          {subscriptions.length > 1 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Select Dog</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subscriptions.map((sub) => (
                    <Card
                      key={sub.id}
                      className={`cursor-pointer transition-all ${
                        selectedSubscription === sub.id ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setSelectedSubscription(sub.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{sub.dogName}</h3>
                            <p className="text-sm text-muted-foreground">{sub.currentRecipe}</p>
                          </div>
                          <Badge className={getStatusColor(sub.status)} variant="secondary">
                            {sub.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedSub && (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Tabs defaultValue="overview" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="delivery">Delivery</TabsTrigger>
                    <TabsTrigger value="plan">Plan Details</TabsTrigger>
                    <TabsTrigger value="billing">Billing</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>{selectedSub.dogName}'s Subscription</CardTitle>
                          <Badge className={getStatusColor(selectedSub.status)} variant="secondary">
                            {selectedSub.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <Label className="text-sm font-medium">Current Recipe</Label>
                            <p className="text-lg">{selectedSub.currentRecipe}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Monthly Cost</Label>
                            <p className="text-lg font-bold">${selectedSub.priceMonthly.toFixed(2)}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Delivery Frequency</Label>
                            <p className="text-lg capitalize">{selectedSub.deliveryFrequency}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Next Delivery</Label>
                            <p className="text-lg">{new Date(selectedSub.nextDeliveryDate).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <Separator />

                        <div className="flex gap-4">
                          <Button
                            variant={selectedSub.status === "active" ? "outline" : "default"}
                            onClick={() => handlePauseResume(selectedSub.id)}
                            disabled={selectedSub.status === "cancelled"}
                          >
                            {selectedSub.status === "active" ? (
                              <>
                                <Pause className="h-4 w-4 mr-2" />
                                Pause Subscription
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Resume Subscription
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowCancelModal(true)}
                            disabled={selectedSub.status === "cancelled"}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel Subscription
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="delivery" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Delivery Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Delivery Frequency</Label>
                            <Select
                              value={selectedSub.deliveryFrequency}
                              onValueChange={(value) => handleUpdateDeliveryFrequency(selectedSub.id, value)}
                            >
                              <SelectTrigger className="w-full mt-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Meals Per Day</Label>
                            <div className="flex items-center gap-4 mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleUpdateMealsPerDay(selectedSub.id, Math.max(1, selectedSub.mealsPerDay - 1))
                                }
                                disabled={selectedSub.mealsPerDay <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="text-lg font-semibold w-8 text-center">{selectedSub.mealsPerDay}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleUpdateMealsPerDay(selectedSub.id, Math.min(4, selectedSub.mealsPerDay + 1))
                                }
                                disabled={selectedSub.mealsPerDay >= 4}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h3 className="font-semibold">Upcoming Deliveries</h3>
                          <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">
                                      {new Date(Date.now() + i * 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{selectedSub.currentRecipe}</p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="plan" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Plan Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <Label className="text-sm font-medium">Current Recipe</Label>
                            <p className="text-lg">{selectedSub.currentRecipe}</p>
                            <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                              Change Recipe
                            </Button>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Add-ons</Label>
                            {selectedSub.addOns.length > 0 ? (
                              <div className="space-y-2 mt-2">
                                {selectedSub.addOns.map((addon) => (
                                  <div key={addon} className="flex items-center justify-between">
                                    <span>{addon}</span>
                                    <Button variant="ghost" size="sm">
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-muted-foreground">No add-ons selected</p>
                            )}
                            <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Supplement
                            </Button>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <Button variant="outline" onClick={() => (window.location.href = "/plan-builder")}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Full Plan
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="billing" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Billing Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <Label className="text-sm font-medium">Billing Cycle</Label>
                            <p className="text-lg capitalize">{selectedSub.billingCycle}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Next Billing Date</Label>
                            <p className="text-lg">{new Date(selectedSub.nextBillingDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Monthly Amount</Label>
                            <p className="text-lg font-bold">${selectedSub.priceMonthly.toFixed(2)}</p>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h3 className="font-semibold">Payment Method</h3>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">•••• •••• •••• 4242</p>
                                <p className="text-sm text-muted-foreground">Expires 12/25</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Calendar className="h-4 w-4 mr-2" />
                      Skip Next Delivery
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Package className="h-4 w-4 mr-2" />
                      Track Package
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Settings className="h-4 w-4 mr-2" />
                      Update Address
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Update Payment
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Support</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Need help with your subscription? Our team is here to help.
                    </p>
                    <Button variant="outline" className="w-full bg-transparent">
                      Contact Support
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>

        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <CardTitle>Cancel Subscription</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to cancel {selectedSub?.dogName}'s subscription? This action cannot be undone.
                </p>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Reason for cancelling (optional)</Label>
                  <Select value={cancelReason} onValueChange={setCancelReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="too-expensive">Too expensive</SelectItem>
                      <SelectItem value="dog-doesnt-like">Dog doesn't like the food</SelectItem>
                      <SelectItem value="delivery-issues">Delivery issues</SelectItem>
                      <SelectItem value="moving">Moving/relocating</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Additional feedback (optional)</Label>
                  <Textarea
                    value={cancelFeedback}
                    onChange={(e) => setCancelFeedback(e.target.value)}
                    placeholder="Help us improve..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowCancelModal(false)} className="flex-1">
                    Keep Subscription
                  </Button>
                  <Button variant="destructive" onClick={handleCancelSubscription} className="flex-1">
                    Cancel Subscription
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Footer />
      </div>
    </ProtectedRoute>
  )
}
