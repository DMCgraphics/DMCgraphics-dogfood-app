import type { DogProfile, HealthGoals } from "@/lib/nutrition-calculator"
import type { Citation } from "@/lib/ai/citations"

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

export interface ScoringFactor {
  factor: string
  points: number
  description: string
  impact: 'high' | 'medium' | 'low'
  category: 'age' | 'activity' | 'weight' | 'health' | 'breed' | 'allergens' | 'portions'
}

export interface ConfidenceAdjustment {
  factor: string
  points: number
  description: string
  impact: 'high' | 'medium' | 'low'
}

export interface ConfidenceBreakdown {
  baseScore: number
  adjustments: ConfidenceAdjustment[]
  totalScore: number
  confidenceLevel: 'very high' | 'high' | 'moderate' | 'needs more info'
}

export interface AlternativeRecommendation {
  recipeId: string
  recipeName: string
  confidence: number
  reasoning: string
  differenceFromTop: string
}

export interface AIRecommendation {
  dogId: string
  dogName: string
  recommendedRecipes: string[]
  reasoning: string
  confidence: number
  nutritionalFocus: string[]
  // Enhanced fields for trust and transparency
  confidenceBreakdown?: ConfidenceBreakdown
  llmExplanation?: string
  factorsConsidered: ScoringFactor[]
  alternativeRecommendations?: AlternativeRecommendation[]
  missingData?: string[]
  edgeCases?: string[]
  citations?: Citation[]
}
