import { calculateDER, calculateRER, convertToKg, type DogProfile } from "@/lib/nutrition-calculator"
import { getBasePricePer100g } from "@/lib/pricing-tiers"

export interface PriceCalculationInput {
  dogProfile: Partial<DogProfile>
  caloriesPer100g: number
  isMedical: boolean
}

export interface PriceCalculationResult {
  dailyGrams: number
  costPerDay: number
  costPerWeek: number
  costPerMonth: number
  per100gPrice: number
}

export function calculatePricing(input: PriceCalculationInput): PriceCalculationResult {
  const { dogProfile, caloriesPer100g, isMedical } = input

  const per100gPrice = getBasePricePer100g(dogProfile, isMedical)

  if (!dogProfile.weight || !dogProfile.weightUnit) {
    return {
      dailyGrams: 0,
      costPerDay: 0,
      costPerWeek: 0,
      costPerMonth: 0,
      per100gPrice,
    }
  }

  const weightKg = convertToKg(dogProfile.weight, dogProfile.weightUnit)
  const rer = calculateRER(weightKg)
  const der = calculateDER(rer, dogProfile as DogProfile)

  // Keep full precision for calculations
  const dailyGrams = (der / caloriesPer100g) * 100
  const costPerDay = (dailyGrams / 100) * per100gPrice

  return {
    dailyGrams,
    costPerDay,
    costPerWeek: costPerDay * 7,
    costPerMonth: costPerDay * 30,
    per100gPrice,
  }
}

export function validatePriceInvariance(oldCost: number, newCost: number, tolerance = 0.01): boolean {
  return Math.abs(newCost - oldCost) < tolerance
}
