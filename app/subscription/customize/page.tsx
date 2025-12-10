"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, ArrowLeft, CheckCircle2, PawPrint } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"

// Import step components (we'll create these next)
import { DogProfileStep } from "@/components/subscription-customize/dog-profile-step"
import { RecipeSelectionStep } from "@/components/subscription-customize/recipe-selection-step"

interface DogProfile {
  name: string
  breed?: string
  weight?: number
  weightUnit: "lb" | "kg"
  age?: number
  ageUnit: "months" | "years"
  sex?: "male" | "female"
  isNeutered?: boolean
  activityLevel?: "low" | "moderate" | "high"
  allergies?: string[]
  conditions?: string[]
}

export default function SubscriptionCustomizePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()

  const subscriptionId = searchParams.get("id")

  const [currentStep, setCurrentStep] = useState(0)
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form data
  const [dogProfile, setDogProfile] = useState<DogProfile>({
    name: "",
    weightUnit: "lb",
    ageUnit: "years",
    activityLevel: "moderate",
    allergies: [],
    conditions: []
  })
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([])
  const [mealsPerDay, setMealsPerDay] = useState(2)

  // Fetch subscription details
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user || !subscriptionId) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("id", subscriptionId)
          .eq("user_id", user.id)
          .single()

        if (error || !data) {
          console.error("[customize] Subscription not found:", error)
          router.push("/dashboard")
          return
        }

        // Check if subscription already has a plan
        if (data.plan_id) {
          console.log("[customize] Subscription already has a plan, redirecting...")
          router.push("/dashboard")
          return
        }

        setSubscription(data)
        console.log("[customize] Loaded subscription:", data)
      } catch (err) {
        console.error("[customize] Error loading subscription:", err)
        router.push("/dashboard")
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchSubscription()
    }
  }, [user, subscriptionId, authLoading, router])

  const handleNext = () => {
    setCurrentStep(prev => prev + 1)
  }

  const handleBack = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleComplete = async () => {
    if (!user || !subscription) return

    setSaving(true)
    try {
      console.log("[customize] Creating dog profile and plan...")

      // 1. Create dog profile
      const { data: dogData, error: dogError } = await supabase
        .from("dogs")
        .insert({
          user_id: user.id,
          name: dogProfile.name,
          breed: dogProfile.breed,
          weight: dogProfile.weight,
          weight_unit: dogProfile.weightUnit,
          weight_kg: dogProfile.weightUnit === "lb" ? (dogProfile.weight || 0) / 2.20462 : dogProfile.weight,
          age: dogProfile.age,
          age_unit: dogProfile.ageUnit,
          sex: dogProfile.sex,
          is_neutered: dogProfile.isNeutered,
          activity_level: dogProfile.activityLevel,
          allergies: dogProfile.allergies,
          conditions: dogProfile.conditions
        })
        .select()
        .single()

      if (dogError || !dogData) {
        throw new Error(dogError?.message || "Failed to create dog profile")
      }

      console.log("[customize] Dog created:", dogData.id)

      // 2. Create plan
      const { data: planData, error: planError } = await supabase
        .from("plans")
        .insert({
          user_id: user.id,
          dog_id: dogData.id,
          status: "active",
          plan_type: "topper", // This is a topper subscription from Stripe
          delivery_zipcode: subscription.metadata?.zipcode || null
        })
        .select()
        .single()

      if (planError || !planData) {
        throw new Error(planError?.message || "Failed to create plan")
      }

      console.log("[customize] Plan created:", planData.id)

      // 3. Create plan_dogs entry
      const { error: planDogError } = await supabase
        .from("plan_dogs")
        .insert({
          plan_id: planData.id,
          dog_id: dogData.id,
          meals_per_day: mealsPerDay,
          position: 1
        })

      if (planDogError) {
        throw new Error(planDogError.message || "Failed to link dog to plan")
      }

      // 4. Create plan_items for selected recipes
      if (selectedRecipes.length > 0) {
        // Fetch recipe details
        const { data: recipes, error: recipeError } = await supabase
          .from("recipes")
          .select("id, slug")
          .in("slug", selectedRecipes)

        if (recipeError || !recipes) {
          throw new Error("Failed to fetch recipe details")
        }

        // Create plan items
        const planItems = recipes.map(recipe => ({
          plan_id: planData.id,
          dog_id: dogData.id,
          recipe_id: recipe.id,
          qty: 1,
          billing_interval: subscription.interval || "month"
        }))

        const { error: itemsError } = await supabase
          .from("plan_items")
          .insert(planItems)

        if (itemsError) {
          throw new Error(itemsError.message || "Failed to add recipes to plan")
        }

        console.log("[customize] Plan items created:", planItems.length)
      }

      // 5. Link subscription to plan
      const { error: linkError } = await supabase
        .from("subscriptions")
        .update({ plan_id: planData.id })
        .eq("id", subscription.id)

      if (linkError) {
        throw new Error(linkError.message || "Failed to link subscription to plan")
      }

      console.log("[customize] ✅ Profile completed successfully!")

      // Redirect to dashboard with success message
      router.push("/dashboard?profile_completed=true")
    } catch (error: any) {
      console.error("[customize] Error completing profile:", error)
      alert(`Failed to complete profile: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!subscription) {
    return null // Will redirect to dashboard
  }

  const steps = [
    {
      title: "Welcome",
      description: "Let's set up your topper subscription"
    },
    {
      title: "Dog Profile",
      description: "Tell us about your dog"
    },
    {
      title: "Recipe Selection",
      description: "Choose your dog's meals"
    }
  ]

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 max-w-4xl mx-auto">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center flex-1">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    idx <= currentStep
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted text-muted-foreground"
                  }`}>
                    {idx < currentStep ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 ${
                      idx < currentStep ? "bg-primary" : "bg-muted"
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold">{steps[currentStep].title}</h2>
              <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
            </div>
          </div>

          {/* Step content */}
          <Card>
            <CardContent className="pt-6">
              {currentStep === 0 && (
                <div className="text-center space-y-6 py-8">
                  <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <PawPrint className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold mb-3">Complete Your Profile</h1>
                    <p className="text-lg text-muted-foreground mb-6">
                      You're all set with your subscription! Now let's personalize your dog's meal plan.
                    </p>
                    <div className="bg-muted/50 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-sm">
                        We just need a few details about your dog and their meal preferences to get started.
                        This will only take a couple of minutes!
                      </p>
                    </div>
                  </div>
                  <Button size="lg" onClick={handleNext}>
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {currentStep === 1 && (
                <DogProfileStep
                  dogProfile={dogProfile}
                  onUpdate={setDogProfile}
                />
              )}

              {currentStep === 2 && (
                <RecipeSelectionStep
                  selectedRecipes={selectedRecipes}
                  onUpdate={setSelectedRecipes}
                  mealsPerDay={mealsPerDay}
                  onMealsPerDayUpdate={setMealsPerDay}
                />
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          {currentStep > 0 && (
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={saving}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && !dogProfile.name) ||
                    (currentStep === 2 && selectedRecipes.length === 0)
                  }
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={saving || selectedRecipes.length === 0}
                >
                  {saving ? "Saving..." : "Complete Profile"}
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}
