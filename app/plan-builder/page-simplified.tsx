"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getStripePricingForDog } from "@/lib/stripe-pricing"
import { AuthModal } from "@/components/auth/auth-modal"
import { PlanBuilderPage } from "@/components/plan-builder/plan-builder-page"
import { calculateDERFromProfile, calculateDailyGrams, toKg } from "@/lib/nutrition-calculator"

export default function PlanBuilder() {
  const router = useRouter()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)

  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setIsLoading(false)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      if (event === 'SIGNED_IN' && session) {
        setShowAuthModal(false)
        // Automatically proceed to save plan and checkout
        handlePlanSaveAndCheckout(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handlePlanSaveAndCheckout = async (user) => {
    try {
      console.log("[v0] Starting plan save and checkout for user:", user.id)
      
      // Get plan data from localStorage
      const planData = localStorage.getItem("x-plan-token")
      if (!planData) {
        console.error("[v0] No plan data found in localStorage")
        alert("No plan data found. Please create a plan first.")
        return
      }

      const allDogsData = JSON.parse(planData)
      if (!allDogsData || allDogsData.length === 0) {
        console.error("[v0] No dogs data found")
        alert("No dogs data found. Please create a plan first.")
        return
      }

      // Check for existing plan
      const { data: existingPlans, error: planFetchError } = await supabase
        .from("plans")
        .select("id, status")
        .eq("user_id", user.id)
        .in("status", ["draft", "active", "checkout_in_progress"])
        .order("created_at", { ascending: false })
        .limit(1)
      
      const existingPlan = existingPlans && existingPlans.length > 0 ? existingPlans[0] : null
      let planId

      if (existingPlan) {
        planId = existingPlan.id
        console.log("[v0] Using existing plan:", planId)
        
        // Clean up existing plan items
        await supabase
          .from("plan_items")
          .delete()
          .eq("plan_id", planId)
      } else {
        // Create new plan
        const firstDogData = allDogsData[0]
        if (!firstDogData || !firstDogData.dogProfile.name) {
          console.error("[v0] No dog data available")
          alert("No dog data available. Please try again.")
          return
        }

        // Create first dog
        const weight = firstDogData.dogProfile.weight || 0
        const weightUnit = firstDogData.dogProfile.weightUnit || "lb"

        const { data: firstDogDbData, error: firstDogError } = await supabase
          .from("dogs")
          .insert({
            user_id: user.id,
            name: firstDogData.dogProfile.name,
            breed: firstDogData.dogProfile.breed,
            age: firstDogData.dogProfile.age,
            weight: weight,
            weight_unit: weightUnit,
            weight_kg: toKg(weight, weightUnit),
            allergies: firstDogData.selectedAllergens,
            conditions: firstDogData.medicalNeeds.selectedCondition ? [firstDogData.medicalNeeds.selectedCondition] : [],
          })
          .select("id")
          .single()

        if (firstDogError) {
          console.error("[v0] Error creating first dog:", firstDogError)
          alert(`Error creating dog: ${firstDogError.message}`)
          return
        }

        // Create plan
        const { data: planData, error: planError } = await supabase
          .from("plans")
          .insert({
            user_id: user.id,
            dog_id: firstDogDbData.id,
            status: "draft",
            current_step: 4,
            subtotal_cents: 0,
            discount_cents: 0,
            total_cents: 0,
          })
          .select("id")
          .single()

        if (planError) {
          console.error("[v0] Error creating plan:", planError)
          alert(`Error creating plan: ${planError.message}`)
          return
        }

        planId = planData.id
        console.log("[v0] Created plan with ID:", planId)

        // Create plan-dog relationship
        const { error: planDogError } = await supabase.rpc("upsert_plan_dog", {
          p_plan_id: planId,
          p_dog_id: firstDogDbData.id,
          p_position: 1,
          p_snapshot: null,
          p_meals_per_day: 2,
          p_prescription: null,
          p_verify: false,
        })

        if (planDogError) {
          console.error("[v0] Error creating plan_dog relationship:", planDogError)
          alert(`Error creating plan-dog relationship: ${planDogError.message}`)
          return
        }
      }

      // Save all dogs and recipes
      const startIndex = existingPlan ? 0 : 1
      let firstDogId = null

      if (!existingPlan) {
        firstDogId = firstDogDbData.id
      }

      for (let i = startIndex; i < allDogsData.length; i++) {
        const dogData = allDogsData[i]

        // Create dog if not already created
        let dogDbData
        if (i === 0 && !existingPlan) {
          dogDbData = { id: firstDogId }
        } else {
          const weight = dogData.dogProfile.weight || 0
          const weightUnit = dogData.dogProfile.weightUnit || "lb"

          const { data: newDogData, error: dogError } = await supabase
            .from("dogs")
            .insert({
              user_id: user.id,
              name: dogData.dogProfile.name,
              breed: dogData.dogProfile.breed,
              age: dogData.dogProfile.age,
              weight: weight,
              weight_unit: weightUnit,
              weight_kg: toKg(weight, weightUnit),
              allergies: dogData.selectedAllergens,
              conditions: dogData.medicalNeeds.selectedCondition ? [dogData.medicalNeeds.selectedCondition] : [],
            })
            .select("id")
            .single()

          if (dogError) {
            console.error(`[v0] Error saving dog ${i + 1}:`, dogError)
            alert(`Error saving dog ${i + 1}: ${dogError.message}`)
            continue
          }

          dogDbData = newDogData

          // Create plan-dog relationship
          const { error: planDogError } = await supabase.rpc("upsert_plan_dog", {
            p_plan_id: planId,
            p_dog_id: dogDbData.id,
            p_position: i + 1,
            p_snapshot: null,
            p_meals_per_day: 2,
            p_prescription: null,
            p_verify: false,
          })

          if (planDogError) {
            console.error(`[v0] Error creating plan_dog relationship for dog ${i + 1}:`, planDogError)
            alert(`Error creating plan-dog relationship for dog ${i + 1}: ${planDogError.message}`)
            continue
          }
        }

        // Get recipes for this dog
        const recipes = dogData.selectedRecipes.length > 0 ? dogData.selectedRecipes : [dogData.selectedRecipe].filter(Boolean)

        // Get available recipes from database
        const { data: availableRecipes, error: recipesError } = await supabase
          .from("recipes")
          .select("id, name, slug")
          .eq("is_active", true)

        if (recipesError) {
          console.error("[v0] Error fetching recipes:", recipesError)
          alert("Error fetching recipes. Please try again.")
          continue
        }

        // Create plan items for each recipe
        for (const recipeId of recipes) {
          const recipeData = availableRecipes?.find(
            (r) => r.slug === recipeId || r.id === recipeId || r.name === recipeId,
          )

          if (!recipeData) {
            console.error(`[v0] Recipe not found: ${recipeId}`)
            alert(`Recipe not found: ${recipeId}`)
            continue
          }

          const weight = dogData.dogProfile?.weight || 20
          const weightUnit = dogData.dogProfile?.weightUnit || "lb"
          const weightLbs = weightUnit === "kg" ? weight * 2.20462 : weight
          const stripePricing = getStripePricingForDog(recipeData.slug, weightLbs)

          if (!stripePricing) {
            console.error(`[v0] No Stripe pricing found for recipe: ${recipeId}`)
            alert(`No pricing found for recipe: ${recipeId}`)
            continue
          }

          // Calculate portions using canonical DER formula
          const dogProfile = {
            weight: weight,
            weightUnit: weightUnit,
            age: dogData.dogProfile.age || 4,
            ageUnit: "years" as const,
            sex: dogData.dogProfile.sex || "male" as const,
            breed: dogData.dogProfile.breed || "mixed-breed",
            activity: dogData.dogProfile.activity || "moderate" as const,
            bodyCondition: dogData.dogProfile.bodyCondition || 5,
            isNeutered: dogData.dogProfile.isNeutered ?? true,
            lifeStage: dogData.dogProfile.lifeStage || "adult" as const
          }
          const der = calculateDERFromProfile(dogProfile)
          const caloriesPer100g = 175 // Realistic calories per 100g of fresh dog food
          const dailyGrams = calculateDailyGrams(der, caloriesPer100g)
          const monthlyGrams = dailyGrams * 30
          const sizeG = Math.ceil(monthlyGrams / 100) * 100

          // Create plan item
          const { data: planItemData, error: planItemError } = await supabase
            .from("plan_items")
            .insert({
              plan_id: planId,
              dog_id: dogDbData.id,
              recipe_id: recipeData.id,
              qty: 1,
              size_g: sizeG,
              billing_interval: "week",
              stripe_price_id: stripePricing.priceId,
              unit_price_cents: stripePricing.amountCents,
              amount_cents: stripePricing.amountCents,
              meta: {
                source: "plan_builder",
                dog_weight: weight,
                weight_unit: weightUnit,
                daily_grams: dailyGrams,
                monthly_grams: monthlyGrams,
                activity_level: dogData.dogProfile.activity,
                calculated_calories: Math.round(der),
                stripe_product_name: stripePricing.productName,
              },
            })
            .select("id")
            .single()

          if (planItemError) {
            console.error(`[v0] Error saving plan item:`, planItemError)
            alert(`Error saving plan item: ${planItemError.message}`)
            continue
          }

          console.log(`[v0] Saved plan item:`, planItemData.id)
        }
      }

      // Update plan status to active
      const { error: updateError } = await supabase
        .from("plans")
        .update({ status: "active" })
        .eq("id", planId)

      if (updateError) {
        console.error("[v0] Error updating plan status:", updateError)
        alert("Error updating plan status. Please try again.")
        return
      }

      console.log("[v0] Plan creation completed successfully")

      // Clear localStorage
      localStorage.removeItem("x-plan-token")

      // Redirect to checkout
      router.push("/checkout")
    } catch (error) {
      console.error("[v0] Error in plan save and checkout:", error)
      alert("There was an error saving your plan. Please try again.")
    }
  }

  const handleProceedToCheckout = () => {
    if (user) {
      // User is already authenticated, proceed to save plan and checkout
      handlePlanSaveAndCheckout(user)
    } else {
      // User needs to authenticate first
      setShowAuthModal(true)
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <>
      <PlanBuilderPage onProceedToCheckout={handleProceedToCheckout} />
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            // This will be handled by the auth state change listener
          }}
        />
      )}
    </>
  )
}
