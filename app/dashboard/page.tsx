"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DogCard } from "@/components/dashboard/dog-card"
import { WeightTracker } from "@/components/dashboard/weight-tracker"
import { StoolLog } from "@/components/dashboard/stool-log"
import { SubscriptionControls } from "@/components/dashboard/subscription-controls"
import { Recommendations } from "@/components/dashboard/recommendations"
import { PrescriptionStatusCard } from "@/components/dashboard/prescription-status-card"
import { MedicalConditionTracker } from "@/components/dashboard/medical-condition-tracker"
import { NutrientInfo } from "@/components/dashboard/nutrient-info"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { mockVerificationRequests } from "@/lib/vet-verification"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { calculateDERFromProfile, calculateDailyGrams } from "@/lib/nutrition-calculator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, PawPrint } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { DogSelectionModal } from "@/components/modals/dog-selection-modal"
import { SubscriptionManagementModal } from "@/components/modals/subscription-management-modal"
import { EditDogModal } from "@/components/modals/edit-dog-modal"

// SWR fetcher function
const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(r => r.json())

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
  const { user, hasSubscription, refreshSubscriptionStatus, isLoading: authLoading } = useAuth()
  const [dogs, setDogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false)
  const [weightEntries, setWeightEntries] = useState([])
  const [stoolEntries, setStoolEntries] = useState([])
  const [isStoolLoading, setIsStoolLoading] = useState(false)
  const [deliveries, setDeliveries] = useState(mockDeliveries)
  const [subscriptionStatus, setSubscriptionStatus] = useState<"active" | "paused" | "cancelled">("active")
  const [planStatus, setPlanStatus] = useState<"none" | "draft" | "saved" | "checkout" | "active">("none")
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null)
  const [showDogSelectionModal, setShowDogSelectionModal] = useState(false)
  const [incompletePlans, setIncompletePlans] = useState<string[]>([])
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [showEditDogModal, setShowEditDogModal] = useState(false)
  const [editingDogId, setEditingDogId] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const [medicalConditions] = useState(mockMedicalConditions)
  const currentVerificationRequest = mockVerificationRequests.find((req) => req.userId === "user-123")

  const selectedDog = dogs.find((dog) => dog.id === selectedDogId) || dogs[0]

  // Check for update success message in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("updated") === "true") {
      setShowUpdateSuccess(true)
      // Remove the parameter from URL
      window.history.replaceState({}, "", window.location.pathname)
      // Auto-hide after 5 seconds
      setTimeout(() => setShowUpdateSuccess(false), 5000)
    }
  }, [])

  // Fetch recommendations for the selected dog
  const { data: recommendations, isLoading: recLoading, error: recError } = useSWR(
    selectedDogId ? `/api/dogs/${selectedDogId}/recommendations` : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  )

  useEffect(() => {
    const fetchDogs = async () => {
      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log("[v0] Dashboard loading timeout - stopping loading state")
        setLoading(false)
      }, 10000) // 10 second timeout

      // Wait for auth to finish loading before proceeding
      if (authLoading) {
        console.log("[v0] Auth still loading, waiting...")
        clearTimeout(timeoutId)
        return
      }

      // Add additional check for auth state consistency
      if (!user || user.id === undefined) {
        console.log("[v0] Auth state not ready:", { authLoading, hasUser: !!user, userId: user?.id })
        clearTimeout(timeoutId)
        setLoading(false)
        return
      }

      // Add small delay for desktop to handle rapid state changes
      await new Promise(resolve => setTimeout(resolve, 100))

      try {
        console.log("[v0] Starting data fetch for user:", user.id)

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
          clearTimeout(timeoutId)
          setLoading(false)
          return
        }

        console.log("[v0] Successfully fetched", dogsData?.length || 0, "dogs")

        const { data: planData } = await supabase
          .from("plans")
          .select(`
            *,
            plan_items (
              *,
              recipes (name, macros)
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        console.log("[v0] Plan data:", planData)
        console.log("[v0] Dogs data:", dogsData)

        // Fetch subscription data - no retries needed, just fetch once
        let subscriptionsData = null
        try {
          const { data: subsData, error: subsError } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", user.id)
            .in("status", ["active", "trialing", "past_due", "canceled", "paused"])

          if (subsError) {
            console.error("[v0] Error fetching subscriptions:", subsError)
          } else {
            subscriptionsData = subsData
            console.log("[v0] Subscriptions data:", subscriptionsData)
          }
        } catch (error) {
          console.error("[v0] Exception fetching subscriptions:", error)
        }

        const { data: activePlansData } = await supabase
          .from("plans")
          .select("*")
          .eq("user_id", user.id)
          .in("status", ["active", "purchased", "checkout_in_progress"])

        console.log("[v0] Active plans data:", activePlansData)

        // Refresh auth context subscription status to ensure consistency
        // Don't await this to prevent dashboard timeout - it will update in background
        if (refreshSubscriptionStatus) {
          refreshSubscriptionStatus().catch(error => {
            console.log("[v0] Subscription status refresh failed (non-blocking):", error)
          })
        }

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

        // Note: Stool entries will be fetched per-dog when selectedDogId changes
        console.log("[v0] Stool entries will be fetched per-dog")

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
              // Get all recipe names if multiple recipes are selected
              if (dogPlan.plan_items && dogPlan.plan_items.length > 0) {
                const recipeNames = dogPlan.plan_items
                  .map(item => item.recipes?.name)
                  .filter(Boolean)
                if (recipeNames.length > 0) {
                  currentRecipe = recipeNames.join(", ")
                  console.log("[v0] Found recipes from plan:", currentRecipe, "for", dog.name)
                }
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
              // Use the actual subscription status from the database
              // Check both status and cancel_at_period_end flag
              if (dogSubscription) {
                if (dogSubscription.status === "canceled" || dogSubscription.cancel_at_period_end) {
                  subscriptionStatus = "cancelled"
                } else if (dogSubscription.status === "paused") {
                  subscriptionStatus = "paused"
                } else {
                  subscriptionStatus = "active"
                }
              } else {
                subscriptionStatus = "active"
              }

              // Handle next delivery for canceled subscriptions
              if (dogSubscription && (dogSubscription.status === "canceled" || dogSubscription.cancel_at_period_end)) {
                if (dogSubscription.current_period_end) {
                  const periodEnd = new Date(dogSubscription.current_period_end)
                  const now = new Date()
                  // If period hasn't ended yet, show when access ends
                  if (periodEnd > now) {
                    nextDelivery = `Ends ${periodEnd.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}`
                  } else {
                    nextDelivery = "Subscription Canceled"
                  }
                } else {
                  nextDelivery = "Subscription Canceled"
                }
                console.log("[v0] Canceled subscription for", dog.name, "next delivery:", nextDelivery)
              } else {
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
              }
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

            // Get nutritional data from recipe
            let nutritionalData = {
              dailyCalories: 0,
              protein: 0,
              fat: 0,
              carbs: 0,
              fiber: 0,
              moisture: 0
            }

            // Always calculate DER for all dogs, regardless of recipe status
            try {
              const dogProfile = {
                weight: planWeight,
                weightUnit: dog.weight_unit || "lb",
                age: dog.age || 4,
                ageUnit: "years" as const,
                sex: "male" as const,
                breed: dog.breed || "mixed-breed",
                activity: "moderate" as const,
                bodyCondition: 5,
                isNeutered: true,
                lifeStage: "adult" as const
              }
              console.log(`[v0] Dog profile for calculation:`, dogProfile)
              const der = calculateDERFromProfile(dogProfile)
              console.log(`[v0] Calculated DER:`, der)
              
              // Check if dog has a recipe
              if (dogPlan) {
                const planItem = dogPlan.plan_items?.[0]
                if (planItem?.recipes) {
                  const dbRecipe = planItem.recipes
                  console.log(`[v0] Recipe data for ${dog.name}:`, dbRecipe)
                  console.log(`[v0] Recipe macros:`, dbRecipe.macros)
                  
                  // Use realistic calorie density for fresh dog food (150-200 kcal/100g)
                  const caloriesPer100g = 175 // Default realistic value for fresh cooked dog food
                  const dailyGrams = calculateDailyGrams(der, caloriesPer100g)
                  
                  nutritionalData = {
                    dailyCalories: Math.round(der),
                    protein: dbRecipe.macros?.protein || 0,
                    fat: dbRecipe.macros?.fat || 0,
                    carbs: dbRecipe.macros?.carbs || 0,
                    fiber: dbRecipe.macros?.fiber || 7, // Use recipe fiber or default
                    moisture: dbRecipe.macros?.moisture || 74 // Use recipe moisture or default
                  }
                  console.log(`[v0] Final nutritional data for ${dog.name}:`, nutritionalData)
                  console.log(`[v0] Protein: ${dbRecipe.macros?.protein}, Fat: ${dbRecipe.macros?.fat}, Carbs: ${dbRecipe.macros?.carbs}`)
                } else {
                  // Dog has a plan but no recipe - show DER only
                  nutritionalData = {
                    dailyCalories: Math.round(der),
                    protein: 0, // Will show as "Select a recipe to see nutritional breakdown"
                    fat: 0,
                    carbs: 0,
                    fiber: 0,
                    moisture: 0
                  }
                  console.log(`[v0] Dog ${dog.name} has plan but no recipe - showing DER only:`, nutritionalData)
                }
              } else {
                // Dog has no plan - show DER only
                nutritionalData = {
                  dailyCalories: Math.round(der),
                  protein: 0, // Will show as "Select a recipe to see nutritional breakdown"
                  fat: 0,
                  carbs: 0,
                  fiber: 0,
                  moisture: 0
                }
                console.log(`[v0] Dog ${dog.name} has no plan - showing DER only:`, nutritionalData)
              }
            } catch (error) {
              console.error(`[v0] Error calculating nutrition for ${dog.name}:`, error)
              // Fallback to default values
              nutritionalData = {
                dailyCalories: 0,
                protein: 0,
                fat: 0,
                carbs: 0,
                fiber: 0,
                moisture: 0
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
              avatar_url: dog.avatar_url,
              currentRecipe: currentRecipe,
              nextDelivery: nextDelivery,
              subscriptionStatus: subscriptionStatus,
              hasMedicalItems: hasMedicalItems,
              ...nutritionalData,
            }
          }) || []

        console.log("[v0] Transformed dogs data:", transformedDogs)
        setDogs(transformedDogs)
        if (transformedDogs.length > 0 && !selectedDogId) {
          setSelectedDogId(transformedDogs[0].id)
        }
        console.log("[v0] Fetched dogs with plan data:", transformedDogs)
        console.log("[v0] Subscription status - hasActiveSub:", hasActiveSub, "planStatus:", overallPlanStatus)

        // Deliveries will be set per-dog in useEffect
      } catch (error) {
        console.error("[v0] Error in fetchDogs:", error)
      } finally {
        clearTimeout(timeoutId)
        setLoading(false)
      }
    }

    fetchDogs()
  }, [user, authLoading, refreshTrigger])

  // Debug selectedDog data
  useEffect(() => {
    if (selectedDog) {
      console.log(`[v0] Selected dog data:`, selectedDog)
      console.log(`[v0] Selected dog nutrition:`, {
        dailyCalories: selectedDog.dailyCalories,
        protein: selectedDog.protein,
        fat: selectedDog.fat,
        carbs: selectedDog.carbs,
        fiber: selectedDog.fiber,
        moisture: selectedDog.moisture
      })
    }
  }, [selectedDog])

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

    const fetchStoolEntries = async () => {
      if (!selectedDogId) return

      try {
        const { data: stoolData } = await supabase
          .from("dog_notes")
          .select("*")
          .eq("dog_id", selectedDogId)
          .order("created_at", { ascending: false })
          .limit(10)

        if (stoolData) {
          const formattedStoolEntries = stoolData.map((entry: any) => {
            // Extract score from note text (e.g., "Score 4 - Ideal consistency")
            const scoreMatch = entry.note?.match(/Score (\d+)/i)
            const score = scoreMatch ? parseInt(scoreMatch[1]) : 4
            
            return {
              date: entry.created_at.split('T')[0],
              score: score,
              notes: entry.note || "",
            }
          })
          setStoolEntries(formattedStoolEntries)
          console.log("[v0] Loaded stool entries from database for dog:", selectedDogId, formattedStoolEntries)
        }
      } catch (error) {
        console.error("[v0] Error fetching stool entries:", error)
      }
    }

    const fetchDeliveries = async () => {
      if (!selectedDogId || !user) return

      try {
        // Fetch orders for this specific dog
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

        if (ordersData) {
          // Filter orders that include this specific dog
          const dogOrders = ordersData.filter((order: any) => {
            return order.plan?.plan_items?.some((item: any) => item.dog_id === selectedDogId)
          })

          const formattedDeliveries = dogOrders.map((order: any) => ({
            id: order.id,
            date: order.created_at,
            status: order.status === "completed" ? "delivered" : "upcoming",
            items: order.plan?.plan_items
              ?.filter((item: any) => item.dog_id === selectedDogId)
              ?.map((item: any) => 
                item.recipes ? `${item.recipes.name} (${item.qty || 1} weeks)` : item.name
              ) || [],
          }))

          setDeliveries(formattedDeliveries.length > 0 ? formattedDeliveries : mockDeliveries)
          console.log("[v0] Loaded deliveries from database for dog:", selectedDogId, formattedDeliveries)
        }
      } catch (error) {
        console.error("[v0] Error fetching deliveries:", error)
      }
    }

    fetchWeightEntries()
    fetchStoolEntries()
    fetchDeliveries()
  }, [selectedDogId, user])

  const handleEditDog = (dogId: string) => {
    setEditingDogId(dogId)
    setShowEditDogModal(true)
  }

  const handleDogUpdated = () => {
    // Trigger a refresh by updating the refresh trigger
    // This will cause the useEffect to re-run and fetch updated data
    setRefreshTrigger(prev => prev + 1)
  }

  const handleSelectDog = (dogId: string) => {
    setSelectedDogId(dogId)
    console.log("[v0] Selected dog:", dogId)
  }

  const handleAddWeightEntry = async (entry: { weight: number; notes?: string }) => {
    if (!selectedDogId) return

    try {
      // Save to database using upsert to handle unique constraint
      const today = new Date().toISOString().split("T")[0]
      const { error } = await supabase.from("dog_metrics").upsert({
        dog_id: selectedDogId,
        weight_kg: entry.weight / 2.20462, // Convert lbs to kg
        body_condition_score: 5, // Default value
        measured_at: today,
        notes: entry.notes || "Weight logged by user",
      }, {
        onConflict: 'dog_id,measured_at'
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

  const handleAddStoolEntry = async (entry: { score: number; notes?: string }) => {
    if (!selectedDogId) return

    setIsStoolLoading(true)
    try {
      // Create the note text with score and notes
      const noteText = `Score ${entry.score} - ${entry.notes || 'No additional notes'}`
      
      // Save to database
      const { data, error } = await supabase
        .from("dog_notes")
        .insert({
          dog_id: selectedDogId,
          note: noteText,
          created_at: new Date().toISOString(),
        })
        .select()

      if (error) {
        console.error("[v0] Error saving stool entry:", error)
        return
      }

      // Update local state - add new entry at the beginning (newest first)
      const newEntry = {
        date: new Date().toISOString().split("T")[0],
        score: entry.score,
        notes: entry.notes || "",
      }
      setStoolEntries([newEntry, ...stoolEntries])
      
      console.log("[v0] Stool entry saved successfully:", data)
    } catch (error) {
      console.error("[v0] Error in handleAddStoolEntry:", error)
    } finally {
      setIsStoolLoading(false)
    }
  }

  const handlePauseResume = () => {
    setSubscriptionStatus(subscriptionStatus === "active" ? "paused" : "active")
  }

  const handleSkipDelivery = (deliveryId: string) => {
    alert(`Skip delivery ${deliveryId} - this would update the delivery schedule`)
  }

  const handleManageSubscription = () => {
    setShowSubscriptionModal(true)
  }

  const handleTakeAction = (recommendationId: string) => {
    console.log('Taking action on recommendation:', recommendationId)
    
    switch (recommendationId) {
      case 'portion-down':
      case 'portion-up':
      case 'activity-mismatch':
        // Navigate to plan builder with portion adjustment
        localStorage.setItem('nouripet-selected-dog', JSON.stringify(selectedDog))
        window.location.href = '/plan-builder?step=portion'
        break
      
      case 'stool-firm':
      case 'stool-soft':
      case 'medical-low-fat':
        // Navigate to plan builder with recipe selection
        localStorage.setItem('nouripet-selected-dog', JSON.stringify(selectedDog))
        window.location.href = '/plan-builder?step=recipe'
        break
      
      case 'joint-support':
        // Navigate to plan builder with supplements
        localStorage.setItem('nouripet-selected-dog', JSON.stringify(selectedDog))
        window.location.href = '/plan-builder?step=supplements'
        break
      
      case 'vet-advisory':
        // Open vet finder or contact modal
        alert('Consider scheduling a veterinary checkup. You can find local vets in your area or contact your current vet.')
        break
      
      case 'log-nudge':
        // Focus on the weight tracker or stool log
        const weightTracker = document.querySelector('[data-testid="weight-tracker"]')
        const stoolLog = document.querySelector('[data-testid="stool-log"]')
        if (weightTracker) {
          weightTracker.scrollIntoView({ behavior: 'smooth' })
        } else if (stoolLog) {
          stoolLog.scrollIntoView({ behavior: 'smooth' })
        }
        break
      
      default:
        console.log('Unknown recommendation action:', recommendationId)
        alert(`Action for ${recommendationId} would be implemented here`)
    }
  }

  const handleAddDog = () => {
    localStorage.removeItem("nouripet-selected-dog")
    // Set parameters to skip dog count selection and go directly to step 1
    localStorage.setItem("nouripet-add-dog-mode", "true")
    localStorage.setItem("nouripet-total-dogs", (dogs.length + 1).toString()) // Current dogs + 1 new dog
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
          {showUpdateSuccess && (
            <Card className="mb-6 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-900 dark:text-green-100">Subscription Updated!</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Your subscription has been successfully updated with your new meal selections.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUpdateSuccess(false)}
                    className="ml-auto"
                  >
                    ×
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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

                <StoolLog dogName={selectedDog.name} entries={stoolEntries} onAddEntry={handleAddStoolEntry} isLoading={isStoolLoading} />

                {selectedDog.hasMedicalItems && (
                  <MedicalConditionTracker
                    conditions={medicalConditions}
                    onScheduleCheckup={handleScheduleCheckup}
                    onUpdateCondition={handleUpdateCondition}
                  />
                )}
              </div>

              <div className="space-y-8">
                <NutrientInfo
                  dogName={selectedDog.name}
                  recipeName={selectedDog.currentRecipe}
                  dailyCalories={selectedDog.dailyCalories}
                  protein={selectedDog.protein}
                  fat={selectedDog.fat}
                  carbs={selectedDog.carbs}
                  fiber={selectedDog.fiber}
                  moisture={selectedDog.moisture}
                />

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
                  recommendations={recommendations || []}
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
        <SubscriptionManagementModal open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal} />
        <EditDogModal 
          open={showEditDogModal} 
          onOpenChange={setShowEditDogModal} 
          dogId={editingDogId}
          onDogUpdated={handleDogUpdated}
        />
        <Footer />
      </div>
    </ProtectedRoute>
  )
}
