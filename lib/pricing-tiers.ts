import type { DogProfile } from "@/lib/nutrition-calculator"

// Base price per 100g by weight class.
// Numbers target ~ $0.010–$0.013 per kcal for non-medical plans.
export function getBasePricePer100g(dog: Partial<DogProfile> | undefined, isMedical: boolean): number {
  if (!dog?.weight || !dog?.weightUnit) return isMedical ? 3.25 + 1.0 : 3.25

  const weightLb = dog.weightUnit === "kg" ? dog.weight * 2.20462 : dog.weight
  let price: number

  if (weightLb < 15)
    price = 2.5 // toy/small
  else if (weightLb <= 30)
    price = 2.25 // small/medium
  else if (weightLb <= 60)
    price = 2.0 // medium/large
  else price = 1.75 // giant

  // Medical (therapeutic) uplift
  if (isMedical) price += 1.0

  return price
}
