// AAFCO nutritional standards for transparency panels
export interface AAFCOStandard {
  nutrient: string
  unit: string
  adultMin: number
  adultMax?: number
  growthMin: number
  growthMax?: number
}

export const aafcoStandards: AAFCOStandard[] = [
  { nutrient: "Protein", unit: "%", adultMin: 18, growthMin: 22 },
  { nutrient: "Fat", unit: "%", adultMin: 5.5, growthMin: 8 },
  { nutrient: "Fiber", unit: "%", adultMin: 0, adultMax: 8, growthMin: 0, growthMax: 8 },
  { nutrient: "Moisture", unit: "%", adultMin: 0, adultMax: 12, growthMin: 0, growthMax: 12 },
  { nutrient: "Calcium", unit: "mg/100g", adultMin: 600, adultMax: 1800, growthMin: 1000, growthMax: 2500 },
  { nutrient: "Phosphorus", unit: "mg/100g", adultMin: 500, adultMax: 1600, growthMin: 800, growthMax: 1600 },
  { nutrient: "EPA+DHA", unit: "mg/100g", adultMin: 50, growthMin: 50 },
]

export function getAAFCOCompliance(
  nutrient: string,
  value: number,
  lifeStage: "adult" | "growth" | "all" = "adult",
): "OK" | "LOW" | "HIGH" | "OPTIMAL" {
  const standard = aafcoStandards.find((s) => s.nutrient === nutrient)
  if (!standard) return "OK"

  const min = lifeStage === "growth" ? standard.growthMin : standard.adultMin
  const max = lifeStage === "growth" ? standard.growthMax : standard.adultMax

  if (value < min) return "LOW"
  if (max && value > max) return "HIGH"
  if (value >= min * 1.2) return "OPTIMAL" // 20% above minimum is optimal
  return "OK"
}

export function getComplianceColor(status: string): string {
  switch (status) {
    case "LOW":
      return "text-destructive"
    case "HIGH":
      return "text-orange-500"
    case "OPTIMAL":
      return "text-primary"
    case "OK":
    default:
      return "text-green-600"
  }
}

export function getComplianceBarColor(status: string): string {
  switch (status) {
    case "LOW":
      return "bg-destructive"
    case "HIGH":
      return "bg-orange-500"
    case "OPTIMAL":
      return "bg-primary"
    case "OK":
    default:
      return "bg-green-600"
  }
}
