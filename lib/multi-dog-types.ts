import type { DogProfile, HealthGoals } from "@/lib/nutrition-calculator"

export interface MultiDogProfile extends DogProfile {
  id: string
  name: string
  medicalNeeds?: {
    hasMedicalNeeds: string | null
    selectedCondition: string | null
    selectedPrescriptionDiet: string | null
    verificationRequired: boolean
  }
  healthGoals?: HealthGoals
  selectedAllergens?: string[]
  selectedRecipe?: string | null
  selectedAddOns?: string[]
  mealsPerDay?: number
}

export interface MultiDogPlan {
  dogs: MultiDogProfile[]
  sharedMeals: boolean
  deliveryFrequency: "weekly" | "biweekly" | "monthly"
  totalCostEstimate: number
}

export interface AIRecommendation {
  dogId: string
  dogName: string
  recommendedRecipes: string[]
  reasoning: string
  confidence: number
  nutritionalFocus: string[]
}
