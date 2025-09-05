"use client"

import type React from "react"
import { createContext, useContext, useMemo, useRef, useCallback } from "react"
import { calculateDER, calculateRER, convertToKg, mockRecipes, type DogProfile } from "@/lib/nutrition-calculator"
import { prescriptionDiets } from "@/lib/prescription-diets"
import { analytics } from "@/lib/analytics"
import { getBasePricePer100g } from "@/lib/pricing-tiers"
import { getPackPortion } from "@/lib/pack-portioning"
import { getStripePricingForDog } from "@/lib/stripe-pricing"

interface PricingData {
  activeCaloriesPer100g: number | null
  dailyGrams: number
  per100gPrice: number
  costPerDay: number
  costPerWeek: number
  costPerMonth: number
  recipeNames: string[]
  isMedical: boolean
  packInfo: {
    packSize: number
    packsPerDay: number
    packsPerMonth: number
    gramsPerDay: number
  }
}

interface PricingSnapshot {
  costPerDay: number
  timestamp: number
  mealsPerDay: number
}

interface PlanPricingContextType {
  pricing: PricingData
  gramsPerMeal: (mealsPerDay: number) => number
  validatePriceInvariance: (oldCost: number, newCost: number, mealsPerDay: number) => boolean
  trackMealsPerDayChange: (from: number, to: number) => void
  getPricingSnapshot: () => PricingSnapshot
  restorePricingSnapshot: (snapshot: PricingSnapshot) => void
}

const PlanPricingContext = createContext<PlanPricingContextType | null>(null)

interface PlanPricingProviderProps {
  children: React.ReactNode
  dogProfile: Partial<DogProfile>
  selectedRecipeId?: string | null
  selectedRecipes?: string[]
  selectedPrescriptionDiet?: string | null
  mealsPerDay: number
}

export function PlanPricingProvider({
  children,
  dogProfile,
  selectedRecipeId,
  selectedRecipes = [],
  selectedPrescriptionDiet,
  mealsPerDay,
}: PlanPricingProviderProps) {
  const pricingSnapshotRef = useRef<PricingSnapshot | null>(null)

  const pricing = useMemo(() => {
    console.log("[v0] Pricing calculation started:", {
      dogProfile,
      selectedRecipeId,
      selectedRecipes,
      selectedPrescriptionDiet,
      mealsPerDay,
    })

    let activeCaloriesPer100g: number | null = null
    let recipeNames: string[] = []
    let isMedical = false
    let recipeIds: string[] = []

    if (selectedPrescriptionDiet) {
      const prescriptionRecipe = prescriptionDiets.find((d) => d.id === selectedPrescriptionDiet)
      if (prescriptionRecipe) {
        activeCaloriesPer100g = prescriptionRecipe.nutritionalProfile?.calories || prescriptionRecipe.kcalPer100g
        recipeNames = [prescriptionRecipe.name]
        recipeIds = [selectedPrescriptionDiet]
        isMedical = true
      }
    } else if (selectedRecipes && selectedRecipes.length > 1) {
      const recipes = selectedRecipes.map((id) => mockRecipes.find((r) => r.id === id)).filter(Boolean)
      if (recipes.length > 0) {
        activeCaloriesPer100g = recipes.reduce((sum, recipe) => sum + recipe.kcalPer100g, 0) / recipes.length
        recipeNames = recipes.map((r) => r.name)
        recipeIds = selectedRecipes
      }
    } else if (selectedRecipes && selectedRecipes.length === 1) {
      const recipe = mockRecipes.find((r) => r.id === selectedRecipes[0])
      if (recipe) {
        activeCaloriesPer100g = recipe.kcalPer100g
        recipeNames = [recipe.name]
        recipeIds = selectedRecipes
      }
    } else if (selectedRecipeId) {
      const recipe = mockRecipes.find((r) => r.id === selectedRecipeId)
      if (recipe) {
        activeCaloriesPer100g = recipe.kcalPer100g
        recipeNames = [recipe.name]
        recipeIds = [selectedRecipeId]
      }
    }

    let costPerWeek = 0
    let costPerDay = 0
    let costPerMonth = 0
    let per100gPrice = 0

    let primaryRecipeSlug: string | null = null
    if (selectedPrescriptionDiet) {
      const prescriptionRecipe = prescriptionDiets.find((d) => d.id === selectedPrescriptionDiet)
      primaryRecipeSlug = prescriptionRecipe?.slug || null
    } else if (selectedRecipes && selectedRecipes.length > 0) {
      const recipe = mockRecipes.find((r) => r.id === selectedRecipes[0])
      primaryRecipeSlug = recipe?.id || null
    } else if (selectedRecipeId) {
      const recipe = mockRecipes.find((r) => r.id === selectedRecipeId)
      primaryRecipeSlug = recipe?.id || null
    }

    console.log("[v0] Recipe slug lookup:", {
      primaryRecipeSlug,
      selectedRecipeId,
      selectedRecipes,
      selectedPrescriptionDiet,
    })

    if (primaryRecipeSlug && dogProfile.weight && dogProfile.weightUnit) {
      const weightLbs = dogProfile.weightUnit === "kg" ? dogProfile.weight * 2.20462 : dogProfile.weight
      const stripePricing = getStripePricingForDog(primaryRecipeSlug, weightLbs)

      console.log("[v0] Stripe pricing lookup:", {
        primaryRecipeSlug,
        weightLbs,
        stripePricing,
        dogWeight: dogProfile.weight,
        dogWeightUnit: dogProfile.weightUnit,
      })

      if (stripePricing) {
        costPerWeek = stripePricing.amountCents / 100
        costPerDay = costPerWeek / 7
        costPerMonth = costPerWeek * 4.33 // Average weeks per month

        console.log("[v0] Using Stripe pricing:", {
          amountCents: stripePricing.amountCents,
          costPerWeek,
          costPerDay,
          costPerMonth,
        })

        if (activeCaloriesPer100g && dogProfile.weight && dogProfile.weightUnit) {
          const weightKg = convertToKg(dogProfile.weight, dogProfile.weightUnit)
          const rer = calculateRER(weightKg)
          const der = calculateDER(rer, dogProfile as DogProfile)
          const dailyGrams = (der / activeCaloriesPer100g) * 100
          per100gPrice = dailyGrams > 0 ? (costPerDay / dailyGrams) * 100 : 0
        }
      } else {
        console.log("[v0] No Stripe pricing found, using fallback calculation")
        per100gPrice = getBasePricePer100g(dogProfile, isMedical)
        if (activeCaloriesPer100g && dogProfile.weight && dogProfile.weightUnit) {
          const weightKg = convertToKg(dogProfile.weight, dogProfile.weightUnit)
          const rer = calculateRER(weightKg)
          const der = calculateDER(rer, dogProfile as DogProfile)
          const dailyGrams = (der / activeCaloriesPer100g) * 100
          costPerDay = (dailyGrams / 100) * per100gPrice
          costPerWeek = costPerDay * 7
          costPerMonth = costPerDay * 30

          console.log("[v0] Fallback pricing calculation:", {
            per100gPrice,
            dailyGrams,
            costPerDay,
            costPerWeek,
            costPerMonth,
          })
        }
      }
    } else {
      console.log("[v0] Missing required data for pricing:", {
        hasPrimaryRecipeSlug: !!primaryRecipeSlug,
        hasWeight: !!dogProfile.weight,
        hasWeightUnit: !!dogProfile.weightUnit,
      })

      if (activeCaloriesPer100g && dogProfile.weight && dogProfile.weightUnit) {
        const weightKg = convertToKg(dogProfile.weight, dogProfile.weightUnit)
        const rer = calculateRER(weightKg)
        const der = calculateDER(rer, dogProfile as DogProfile)
        const dailyGrams = (der / activeCaloriesPer100g) * 100
        per100gPrice = getBasePricePer100g(dogProfile, isMedical)
        costPerDay = (dailyGrams / 100) * per100gPrice
        costPerWeek = costPerDay * 7
        costPerMonth = costPerDay * 30
      }
    }

    let dailyGrams = 0
    if (activeCaloriesPer100g && dogProfile.weight && dogProfile.weightUnit) {
      const weightKg = convertToKg(dogProfile.weight, dogProfile.weightUnit)
      const rer = calculateRER(weightKg)
      const der = calculateDER(rer, dogProfile as DogProfile)
      dailyGrams = (der / activeCaloriesPer100g) * 100
    }

    const packInfo = getPackPortion(dailyGrams)

    const pricingData = {
      activeCaloriesPer100g,
      dailyGrams,
      per100gPrice,
      costPerDay,
      costPerWeek,
      costPerMonth,
      recipeNames,
      isMedical,
      packInfo,
    }

    console.log("[v0] Final pricing data:", pricingData)

    if (activeCaloriesPer100g && costPerDay > 0) {
      analytics.trackPricingBasisRendered({
        recipeIds,
        medical: isMedical,
        mealsPerDay,
        kcalPer100g: activeCaloriesPer100g,
        costPerDay,
        dogId: dogProfile.name || "unknown",
      })
    }

    return pricingData
  }, [dogProfile, selectedRecipeId, selectedRecipes, selectedPrescriptionDiet, mealsPerDay])

  const gramsPerMeal = useCallback(
    (mealsPerDay: number) => {
      return pricing.dailyGrams / mealsPerDay
    },
    [pricing.dailyGrams],
  )

  const validatePriceInvariance = useCallback(
    (oldCost: number, newCost: number, currentMealsPerDay: number) => {
      const diff = Math.abs(newCost - oldCost)
      const tolerance = 0.01
      const isValid = diff < tolerance

      if (!isValid) {
        console.error("[v0] Price invariance violation:", {
          oldCost,
          newCost,
          diff,
          tolerance,
          recipeIds: selectedRecipes.length > 0 ? selectedRecipes : [selectedRecipeId],
          prescriptionDiet: selectedPrescriptionDiet,
          mealsPerDay: currentMealsPerDay,
        })

        analytics.trackPricingInvarianceViolation({
          oldCost,
          newCost,
          diff,
          recipeIds: selectedRecipes.length > 0 ? selectedRecipes : [selectedRecipeId].filter(Boolean),
          prescriptionDiet: selectedPrescriptionDiet,
          mealsPerDay: currentMealsPerDay,
          dogId: dogProfile.name || "unknown",
        })
      }

      return isValid
    },
    [selectedRecipes, selectedRecipeId, selectedPrescriptionDiet, dogProfile.name],
  )

  const trackMealsPerDayChange = useCallback(
    (from: number, to: number) => {
      analytics.trackMealsPerDayChanged({
        from,
        to,
        costPerDayBefore: pricing.costPerDay,
        costPerDayAfter: pricing.costPerDay, // Should be the same
        priceDiff: 0, // Should always be 0
        dogId: dogProfile.name || "unknown",
      })
    },
    [pricing.costPerDay, dogProfile.name],
  )

  const getPricingSnapshot = useCallback((): PricingSnapshot => {
    const snapshot = {
      costPerDay: pricing.costPerDay,
      timestamp: Date.now(),
      mealsPerDay,
    }
    pricingSnapshotRef.current = snapshot
    return snapshot
  }, [pricing.costPerDay, mealsPerDay])

  const restorePricingSnapshot = useCallback(
    (snapshot: PricingSnapshot) => {
      console.warn("[v0] Pricing snapshot restoration attempted:", {
        current: pricing.costPerDay,
        snapshot: snapshot.costPerDay,
        timeDiff: Date.now() - snapshot.timestamp,
      })
    },
    [pricing.costPerDay],
  )

  const contextValue = useMemo(
    () => ({
      pricing,
      gramsPerMeal,
      validatePriceInvariance,
      trackMealsPerDayChange,
      getPricingSnapshot,
      restorePricingSnapshot,
    }),
    [
      pricing,
      gramsPerMeal,
      validatePriceInvariance,
      trackMealsPerDayChange,
      getPricingSnapshot,
      restorePricingSnapshot,
    ],
  )

  return <PlanPricingContext.Provider value={contextValue}>{children}</PlanPricingContext.Provider>
}

export function usePlanPricing() {
  const context = useContext(PlanPricingContext)
  if (!context) {
    throw new Error("usePlanPricing must be used within a PlanPricingProvider")
  }
  return context
}
