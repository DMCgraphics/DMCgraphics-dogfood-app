"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DogCard } from "@/components/dashboard/dog-card"
import { WeightTracker } from "@/components/dashboard/weight-tracker"
import { StoolLog } from "@/components/dashboard/stool-log"
import { SubscriptionControls } from "@/components/dashboard/subscription-controls"
import { Recommendations } from "@/components/dashboard/recommendations"
import { PrescriptionStatusCard } from "@/components/dashboard/prescription-status-card"
import { MedicalConditionTracker } from "@/components/dashboard/medical-condition-tracker"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { mockVerificationRequests } from "@/lib/vet-verification"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, PawPrint } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { DogSelectionModal } from "@/components/modals/dog-selection-modal"

const mockStoolEntries = [
  { date: "2024-12-01", score: 4, notes: "Perfect consistency" },
  { date: "2024-12-02", score: 4 },
  { date: "2024-12-03", score: 3, notes: "Slightly firm" },
  { date: "2024-12-04", score: 4 },
  { date: "2024-12-05", score: 4 },
]

const mockDeliveries = [
  {
    id: "1",
    date: "2024-12-15",
    status: "upcoming" as const,
    items: ["Chicken & Greens (2 weeks)", "Fish Oil"],
  },
  {
    id: "2",
    date: "2024-12-01",
    status: "delivered" as const,
    items: ["Chicken & Greens (2 weeks)", "Fish Oil"],
  },
  {
    id: "3",
    date: "2024-11-17",
    status: "delivered" as const,
    items: ["Chicken & Greens (2 weeks)"],
  },
]

const mockRecommendations = [
  {
    id: "1",
    type: "portion" as const,
    title: "Consider reducing daily portions",
    description: "Max has lost 2 lbs over the past month, which is great progress toward his target weight.",
    action: "Adjust portions",
    priority: "medium" as const,
    reason: "Weight loss trend indicates current portions may be too large for maintenance",
  },
  {
    id: "2",
    type: "supplement" as const,
    title: "Add joint support supplement",
    description: "As a 4-year-old Golden Retriever, Max would benefit from proactive joint care.",
    action: "Add joint blend",
    priority: "low" as const,
    reason: "Large breed dogs benefit from early joint support to prevent future issues",
  },
]

const mockMedicalConditions = [
  {
    id: "1",
    name: "Kidney Disease (Stage 2)",
    diagnosedDate: new Date("2024-06-15"),
    severity: "moderate" as const,
    status: "stable" as const,
    lastCheckup: new Date("2024-11-01"),
    nextCheckup: new Date("2024-12-20"),
    medications: ["Benazepril", "Omega-3 Supplement"],
    dietaryRestrictions: ["low-phosphorus", "reduced-protein"],
    notes: "Responding well to prescription diet. BUN and creatinine levels stable.",
  },
]

export default function DashboardPage() {
  const { user, hasSubscription } = useAuth()
  const [dogs, setDogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [weightEntries, setWeightEntries] = useState([])
  const [stoolEntries, setStoolEntries] = useState(mockStoolEntries)
  const [deliveries, setDeliveries] = useState(mockDeliveries)
  const [subscriptionStatus, setSubscriptionStatus] = useState<"active" | "paused" | "cancelled">("active")
  const [planStatus, setPlanStatus] = useState<"none" | "draft" | "saved" | "checkout" | "active">("none")
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null)
  const [showDogSelectionModal, setShowDogSelectionModal] = useState(false)
  const [incompletePlans, setIncompletePlans] = useState<string[]>([])

  const [medicalConditions] = useState(mockMedicalConditions)
  const currentVerificationRequest = mockVerificationRequests.find((req) => req.userId === "user-123")

  const selectedDog = dogs.find((dog) => dog.id === selectedDogId) || dogs[0]

  useEffect(() => {
    const fetchDogs = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data: dogsData, error } = await supabase
          .from("dogs")
          .select(`
            *,
            dog_metrics (
              weight_kg,
              body_condition_score,
              measured_at,
              notes
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("[v0] Error fetching dogs:", error.message)
          setLoading(false)
          return
        }

        const { data: planData } = await supabase
          .from("plans")
          .select(`
            *,
            plan_items (
              *,
              recipes (name)
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        console.log("[v0] Plan data:", planData)

        const { data: subscriptionsData } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .in("status", ["active", "trialing", "past_due"])

        console.log("[v0] Subscriptions data:", subscriptionsData)

        const { data: activePlansData } = await supabase
          .from("plans")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")

        console.log("[v0] Active plans data:", activePlansData)

        // Fetch real delivery data from orders
        const { data: ordersData } = await supabase
          .from("orders")
          .select(`
            *,
            plan:plans (
              *,
              plan_items (
                *,
                recipes (name)
              )
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        console.log("[v0] Orders data:", ordersData)

        // Fetch real stool entries (using dog_id since user_id doesn't exist in dog_notes)
        const { data: stoolEntriesData } = await supabase
          .from("dog_notes")
          .select("*")
          .in("dog_id", dogsData?.map(dog => dog.id) || [])
          .order("created_at", { ascending: false })
          .limit(10)

        console.log("[v0] Stool entries data:", stoolEntriesData)

        let overallPlanStatus: "none" | "draft" | "saved" | "checkout" | "active" = "none"
        let hasActiveSub = false
        const incompleteList: string[] = []

        if (dogsData && dogsData.length > 0) {
          if ((subscriptionsData && subscriptionsData.length > 0) || (activePlansData && activePlansData.length > 0)) {
            overallPlanStatus = "active"
            hasActiveSub = true
            console.log("[v0] Found active subscriptions or plans:", {
              subscriptions: subscriptionsData?.length,
              plans: activePlansData?.length,
            })
          } else {
            dogsData.forEach((dog) => {
              const savedPlanData = localStorage.getItem(`nouripet-saved-plan-${dog.id}`)
              const checkoutPlanData = localStorage.getItem("nouripet-checkout-plan")

              if (savedPlanData && !checkoutPlanData) {
                incompleteList.push(dog.id)
              }
            })

            if (incompleteList.length > 0) {
              overallPlanStatus = "saved"
            }
          }
        }

        setPlanStatus(overallPlanStatus)
        setHasActiveSubscription(hasActiveSub)
        setIncompletePlans(incompleteList)

        if (dogsData) {
          dogsData.forEach((dog) => {
            if (dog.dog_metrics) {
              dog.dog_metrics.sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime())
            }
          })
        }

        const transformedDogs =
          dogsData?.map((dog) => {
            let targetWeight = null
            let weightGoal = null
            let planWeight = dog.weight // Default to dog's base weight
            let currentRecipe = "No Recipe Selected"
            let nextDelivery = "No Active Subscription"
            let subscriptionStatus: "active" | "inactive" = "inactive"
            let hasMedicalItems = false

            const latestMetric = dog.dog_metrics?.[0]
            if (latestMetric && latestMetric.weight_kg) {
              planWeight = latestMetric.weight_kg * 2.20462 // Convert kg to lbs
              console.log("[v0] Using most recent weight from dog_metrics:", planWeight, "lbs for", dog.name)
            }

            const dogPlan = planData?.find((plan) => plan.dog_id === dog.id)
            if (dogPlan) {
              const planItem = dogPlan.plan_items?.[0]
              if (planItem?.recipes?.name) {
                currentRecipe = planItem.recipes.name
                console.log("[v0] Found recipe from plan:", currentRecipe, "for", dog.name)
              }

              // Check if plan includes medical or prescription items
              if (dogPlan.plan_items && dogPlan.plan_items.length > 0) {
                hasMedicalItems = dogPlan.plan_items.some(item => {
                  const recipeName = item.recipes?.name?.toLowerCase() || ''
                  return recipeName.includes('medical') ||
                         recipeName.includes('prescription') ||
                         recipeName.includes('renal') ||
                         recipeName.includes('kidney') ||
                         recipeName.includes('therapeutic') ||
                         recipeName.includes('veterinary')
                })
                console.log("[v0] Has medical items for", dog.name, ":", hasMedicalItems)
              }
            }

            const dogSubscription = subscriptionsData?.find((sub) => {
              return dogPlan && dogPlan.id === sub.plan_id
            })

            const isActivePlan = dogPlan && dogPlan.status === "active"

            if (dogSubscription || isActivePlan) {
              subscriptionStatus = "active"

              // Use the subscription's current_period_end for next delivery date
              if (dogSubscription && dogSubscription.current_period_end) {
                const nextDeliveryDate = new Date(dogSubscription.current_period_end)
                nextDelivery = nextDeliveryDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
                console.log("[v0] Using subscription current_period_end for next delivery:", nextDelivery)
              } else {
                // Fallback to calculating from subscription date
                const subscriptionDate = dogSubscription
                  ? new Date(dogSubscription.created_at)
                  : new Date(dogPlan.updated_at)
                const nextDeliveryDate = new Date(subscriptionDate)
                nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 7)
                nextDelivery = nextDeliveryDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
                console.log("[v0] Calculated next delivery from subscription date:", nextDelivery)
              }
              console.log("[v0] Active subscription/plan found for", dog.name, "next delivery:", nextDelivery)
            } else {
              const savedPlanData = localStorage.getItem(`nouripet-saved-plan-${dog.id}`)
              if (savedPlanData) {
                try {
                  const planData = JSON.parse(savedPlanData)
                  targetWeight = planData.plan_data?.healthGoals?.targetWeight
                  weightGoal = planData.plan_data?.healthGoals?.weightGoal
                  if (planData.plan_data?.weight) {
                    planWeight = planData.plan_data.weight
                  }
                  if (planData.plan_data?.selectedRecipe?.name) {
                    currentRecipe = planData.plan_data.selectedRecipe.name
                  }
                } catch (e) {
                  console.error("[v0] Error parsing saved plan data:", e)
                }
              }
            }

            return {
              id: dog.id,
              name: dog.name,
              breed: dog.breed,
              age: dog.age,
              weight: Math.round(planWeight), // Use plan weight instead of base dog weight
              targetWeight: targetWeight ? Math.round(targetWeight * 2.20462) : undefined,
              weightGoal: weightGoal,
              weightUnit: "lb" as const,
              avatar: "/placeholder.svg?height=48&width=48",
              currentRecipe: currentRecipe,
              nextDelivery: nextDelivery,
              subscriptionStatus: subscriptionStatus,
              hasMedicalItems: hasMedicalItems,
            }
          }) || []

        setDogs(transformedDogs)
        if (transformedDogs.length > 0 && !selectedDogId) {
          setSelectedDogId(transformedDogs[0].id)
        }
        console.log("[v0] Fetched dogs with plan data:", transformedDogs)
        console.log("[v0] Subscription status - hasActiveSub:", hasActiveSub, "planStatus:", overallPlanStatus)

        // Convert real data to the format expected by components
        const realDeliveries = (ordersData || []).map((order: any) => ({
          id: order.id,
          date: order.created_at,
          status: order.status === "completed" ? "delivered" : "upcoming",
          items: order.plan?.plan_items?.map((item: any) => 
            item.recipes ? `${item.recipes.name} (${item.qty || 1} weeks)` : item.name
          ) || [],
        }))

        const realStoolEntries = (stoolEntriesData || []).map((entry: any) => {
          // Extract score from note text (e.g., "Score 4 - Ideal consistency")
          const scoreMatch = entry.note?.match(/Score (\d+)/i)
          const score = scoreMatch ? parseInt(scoreMatch[1]) : 4
          
          return {
            date: entry.created_at.split('T')[0],
            score: score,
            notes: entry.note || "",
          }
        })

        setStoolEntries(realStoolEntries.length > 0 ? realStoolEntries : mockStoolEntries)
        setDeliveries(realDeliveries.length > 0 ? realDeliveries : mockDeliveries)
      } catch (error) {
        console.error("[v0] Error in fetchDogs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDogs()
  }, [user])

  useEffect(() => {
    const fetchWeightEntries = async () => {
      if (!selectedDogId) return

      try {
        const { data: weightData } = await supabase
          .from("dog_metrics")
          .select("weight_kg, measured_at, notes")
          .eq("dog_id", selectedDogId)
          .order("measured_at", { ascending: false }) // Order by most recent first

        if (weightData) {
          const formattedWeightEntries = weightData.map((entry) => ({
            date: entry.measured_at.split("T")[0], // Convert timestamp to date
            weight: Math.round(entry.weight_kg * 2.20462 * 10) / 10, // Convert kg to lbs with 1 decimal
            notes: entry.notes,
          }))
          setWeightEntries(formattedWeightEntries)
          console.log("[v0] Loaded weight entries from database:", formattedWeightEntries)

          if (formattedWeightEntries.length > 0) {
            const mostRecentWeight = formattedWeightEntries[0].weight
            setDogs((prevDogs) =>
              prevDogs.map((dog) =>
                dog.id === selectedDogId ? { ...dog, weight: Math.round(mostRecentWeight) } : dog,
              ),
            )
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching weight entries:", error)
      }
    }

    fetchWeightEntries()
  }, [selectedDogId])

  const handleEditDog = (dogId: string) => {
    alert(`Edit dog profile for ${dogId} - this would open an edit modal`)
  }

  const handleSelectDog = (dogId: string) => {
    setSelectedDogId(dogId)
    console.log("[v0] Selected dog:", dogId)
  }

  const handleAddWeightEntry = async (entry: { weight: number; notes?: string }) => {
    if (!selectedDogId) return

    try {
      // Save to database
      const { error } = await supabase.from("dog_metrics").insert({
        dog_id: selectedDogId,
        weight_kg: entry.weight / 2.20462, // Convert lbs to kg
        body_condition_score: 5, // Default value
        measured_at: new Date().toISOString(),
        notes: entry.notes || "Weight logged by user",
      })

      if (error) {
        console.error("[v0] Error saving weight entry:", error)
        return
      }

      // Update local state
      const newEntry = {
        date: new Date().toISOString().split("T")[0],
        weight: entry.weight,
        notes: entry.notes,
      }
      setWeightEntries([newEntry, ...weightEntries]) // Add new entry at the beginning (most recent first)

      setDogs((prevDogs) =>
        prevDogs.map((dog) => (dog.id === selectedDogId ? { ...dog, weight: Math.round(entry.weight) } : dog)),
      )

      console.log("[v0] Weight entry saved successfully:", newEntry)
    } catch (error) {
      console.error("[v0] Error in handleAddWeightEntry:", error)
    }
  }

  const handleAddStoolEntry = (entry: { score: number; notes?: string }) => {
    const newEntry = {
      date: new Date().toISOString().split("T")[0],
      score: entry.score,
      notes: entry.notes,
    }
    setStoolEntries([...stoolEntries, newEntry])
  }

  const handlePauseResume = () => {
    setSubscriptionStatus(subscriptionStatus === "active" ? "paused" : "active")
  }

  const handleSkipDelivery = (deliveryId: string) => {
    alert(`Skip delivery ${deliveryId} - this would update the delivery schedule`)
  }

  const handleManageSubscription = () => {
    window.location.href = "/dashboard/subscription"
  }

  const handleTakeAction = (recommendationId: string) => {
    alert(`Take action on recommendation ${recommendationId} - this would navigate to the appropriate page`)
  }

  const handleAddDog = () => {
    localStorage.removeItem("nouripet-selected-dog")
    window.location.href = "/plan-builder"
  }

  const handleContactVet = () => {
    alert("Contact veterinarian - this would open email/phone contact options")
  }

  const handleRenewPrescription = () => {
    alert("Renew prescription - this would start the renewal process")
  }

  const handleScheduleCheckup = (conditionId: string) => {
    alert(`Schedule checkup for condition ${conditionId} - this would open scheduling interface`)
  }

  const handleUpdateCondition = (conditionId: string) => {
    alert(`Update condition ${conditionId} - this would open condition update form`)
  }

  const handleDogSelection = (selectedDog: any) => {
    if (planStatus === "active") {
      alert("Subscription management - edit/remove/add dogs functionality would go here")
      return
    }

    if (incompletePlans.length === 1) {
      const checkoutPlanData = localStorage.getItem("nouripet-checkout-plan")
      if (!checkoutPlanData) {
        const dogId = incompletePlans[0]
        const savedPlanData = localStorage.getItem(`nouripet-saved-plan-${dogId}`)
        if (savedPlanData) {
          localStorage.setItem("nouripet-checkout-plan", savedPlanData)
        }
      }
      window.location.href = "/checkout"
      return
    }

    if (selectedDog) {
      localStorage.setItem("nouripet-selected-dog", JSON.stringify(selectedDog))
    } else {
      localStorage.removeItem("nouripet-selected-dog")
    }
    window.location.href = "/plan-builder"
  }

  const getActionButtonProps = () => {
    switch (planStatus) {
      case "active":
        return {
          text: "Manage Subscription",
          href: null,
          description: "Edit plans, add/remove dogs, or cancel subscription",
        }
      case "saved":
        if (incompletePlans.length === 1) {
          return {
            text: "Resume Checkout",
            href: null,
            description: "Complete your plan and start your subscription",
          }
        }
        return {
          text: "Resume Building Plan",
          href: null,
          description: "Continue building your personalized nutrition plan",
        }
      default:
        return {
          text: "Build Your Dog's Plan",
          href: null,
          description: "Start with our personalized plan builder to create the perfect nutrition plan for your dog.",
        }
    }
  }

  const handleActionButtonClick = () => {
    const actionButton = getActionButtonProps()

    if (planStatus === "saved" && incompletePlans.length === 1) {
      handleDogSelection(null)
      return
    }

    setShowDogSelectionModal(true)
  }

  const EmptyDashboardState = () => {
    const actionButton = getActionButtonProps()

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-manrope text-2xl lg:text-3xl font-bold">Welcome back, {user?.name || "there"}!</h1>
              <p className="text-muted-foreground">
                {planStatus === "active"
                  ? "Manage your subscription and track your dog's health"
                  : "Start a subscription to track your dog's health and nutrition"}
              </p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <PawPrint className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">
                  {planStatus === "active" ? "Manage Your Plan" : "Ready to get started?"}
                </CardTitle>
                <CardDescription className="text-lg">{actionButton.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4 text-left">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Health Tracking</h3>
                    <p className="text-sm text-muted-foreground">Monitor weight, stool quality, and overall wellness</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Custom Nutrition</h3>
                    <p className="text-sm text-muted-foreground">Personalized recipes based on your dog's needs</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Delivery Management</h3>
                    <p className="text-sm text-muted-foreground">Flexible scheduling and portion control</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Expert Recommendations</h3>
                    <p className="text-sm text-muted-foreground">AI-powered insights for optimal health</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Button size="lg" className="w-full" onClick={handleActionButtonClick}>
                    {actionButton.text}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <p className="text-sm text-muted-foreground">{actionButton.description}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <DogSelectionModal
          open={showDogSelectionModal}
          onOpenChange={setShowDogSelectionModal}
          onSelectDog={handleDogSelection}
          isSubscriptionManagement={planStatus === "active"}
          incompletePlans={incompletePlans}
        />
        <Footer />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your dashboard...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (dogs.length === 0) {
    return <EmptyDashboardState />
  }

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-manrope text-2xl lg:text-3xl font-bold">Welcome back, {user?.name || "there"}!</h1>
              <p className="text-muted-foreground">Track your dog's health and manage your subscription</p>
              {dogs.length > 1 && selectedDog && (
                <p className="text-sm text-primary font-medium mt-1">Currently viewing: {selectedDog.name}</p>
              )}
            </div>
            <Button onClick={handleAddDog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Dog
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {dogs.map((dog) => (
              <DogCard
                key={dog.id}
                dog={dog}
                onEdit={handleEditDog}
                onSelect={handleSelectDog}
                isSelected={dog.id === selectedDogId}
                showSelection={dogs.length > 1}
              />
            ))}
          </div>

          {selectedDog && (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <WeightTracker
                  dogName={selectedDog.name}
                  currentWeight={selectedDog.weight}
                  targetWeight={selectedDog.targetWeight}
                  weightGoal={selectedDog.weightGoal}
                  weightUnit={selectedDog.weightUnit}
                  entries={weightEntries}
                  onAddEntry={handleAddWeightEntry}
                />

                <StoolLog dogName={selectedDog.name} entries={stoolEntries} onAddEntry={handleAddStoolEntry} />

                {selectedDog.hasMedicalItems && (
                  <MedicalConditionTracker
                    conditions={medicalConditions}
                    onScheduleCheckup={handleScheduleCheckup}
                    onUpdateCondition={handleUpdateCondition}
                  />
                )}
              </div>

              <div className="space-y-8">
                {selectedDog.hasMedicalItems && (
                  <PrescriptionStatusCard
                    verificationRequest={currentVerificationRequest}
                    prescriptionDietName="Renal Support Formula"
                    expirationDate={currentVerificationRequest?.expiresAt}
                    onContactVet={handleContactVet}
                    onRenewPrescription={handleRenewPrescription}
                  />
                )}

                <SubscriptionControls
                  subscriptionStatus={subscriptionStatus}
                  nextDelivery={selectedDog.nextDelivery}
                  deliveries={deliveries}
                  onPauseResume={handlePauseResume}
                  onSkipDelivery={handleSkipDelivery}
                  onManageSubscription={handleManageSubscription}
                />

                <Recommendations
                  dogName={selectedDog.name}
                  recommendations={mockRecommendations}
                  onTakeAction={handleTakeAction}
                />
              </div>
            </div>
          )}
        </main>

        <DogSelectionModal
          open={showDogSelectionModal}
          onOpenChange={setShowDogSelectionModal}
          onSelectDog={handleDogSelection}
          isSubscriptionManagement={planStatus === "active"}
          incompletePlans={incompletePlans}
        />
        <Footer />
      </div>
    </ProtectedRoute>
  )
}
