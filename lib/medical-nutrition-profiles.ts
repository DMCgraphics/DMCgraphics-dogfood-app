import type { Recipe } from "./nutrition-calculator"
import type { PrescriptionDiet } from "./prescription-diets"

// AAFCO Nutritional Standards for Adult Dogs (per 100g dry matter)
export interface AAFCOStandards {
  protein: { min: number; max?: number }
  fat: { min: number; max?: number }
  fiber: { max: number }
  calcium: { min: number; max: number }
  phosphorus: { min: number; max: number }
  sodium: { min: number; max: number }
  potassium: { min: number }
  magnesium: { min: number; max: number }
  iron: { min: number; max: number }
  copper: { min: number; max: number }
  zinc: { min: number; max: number }
  manganese: { min: number; max: number }
  selenium: { min: number; max: number }
  iodine: { min: number; max: number }
}

export const aafcoAdultStandards: AAFCOStandards = {
  protein: { min: 18.0 },
  fat: { min: 5.5 },
  fiber: { max: 30.0 },
  calcium: { min: 0.6, max: 2.5 },
  phosphorus: { min: 0.5, max: 1.6 },
  sodium: { min: 0.08, max: 1.2 },
  potassium: { min: 0.6 },
  magnesium: { min: 0.04, max: 0.3 },
  iron: { min: 80, max: 3000 },
  copper: { min: 7.3, max: 250 },
  zinc: { min: 120, max: 1000 },
  manganese: { min: 5.0, max: 200 },
  selenium: { min: 0.11, max: 2.0 },
  iodine: { min: 1.5, max: 50 },
}

// Medical condition-specific nutritional modifications
export interface MedicalNutritionalProfile {
  conditionId: string
  conditionName: string
  modifiedStandards: Partial<AAFCOStandards>
  criticalNutrients: string[]
  restrictedNutrients: string[]
  recommendedNutrients: string[]
  specialConsiderations: string[]
  monitoringParameters: string[]
}

export const medicalNutritionalProfiles: MedicalNutritionalProfile[] = [
  {
    conditionId: "kidney-disease",
    conditionName: "Kidney Disease",
    modifiedStandards: {
      protein: { min: 14.0, max: 18.0 },
      phosphorus: { min: 0.2, max: 0.4 },
      sodium: { min: 0.08, max: 0.3 },
      potassium: { min: 0.6, max: 1.2 },
    },
    criticalNutrients: ["phosphorus", "protein", "sodium"],
    restrictedNutrients: ["phosphorus", "sodium", "protein"],
    recommendedNutrients: ["omega-3", "antioxidants", "b-vitamins"],
    specialConsiderations: [
      "Reduced phosphorus to minimize kidney workload",
      "Moderate protein restriction to reduce uremic toxins",
      "Increased omega-3 fatty acids for anti-inflammatory effects",
      "Enhanced palatability due to potential appetite loss",
    ],
    monitoringParameters: ["BUN", "creatinine", "phosphorus", "potassium", "body weight"],
  },
  {
    conditionId: "liver-disease",
    conditionName: "Liver Disease",
    modifiedStandards: {
      protein: { min: 16.0, max: 20.0 },
      copper: { min: 3.0, max: 7.0 },
      zinc: { min: 150, max: 1000 },
      fat: { min: 5.5, max: 15.0 },
    },
    criticalNutrients: ["copper", "protein", "zinc"],
    restrictedNutrients: ["copper", "poor-quality-protein"],
    recommendedNutrients: ["high-quality-protein", "zinc", "vitamin-e", "milk-thistle"],
    specialConsiderations: [
      "Copper restriction to prevent hepatic accumulation",
      "High-quality, easily digestible protein sources",
      "Increased zinc to counteract copper absorption",
      "Antioxidants to support liver regeneration",
    ],
    monitoringParameters: ["ALT", "AST", "bilirubin", "albumin", "copper levels"],
  },
  {
    conditionId: "heart-disease",
    conditionName: "Heart Disease",
    modifiedStandards: {
      sodium: { min: 0.08, max: 0.25 },
      potassium: { min: 0.8 },
      magnesium: { min: 0.06 },
      fat: { min: 5.5, max: 15.0 },
    },
    criticalNutrients: ["sodium", "taurine", "carnitine"],
    restrictedNutrients: ["sodium", "excessive-fat"],
    recommendedNutrients: ["taurine", "l-carnitine", "omega-3", "coq10"],
    specialConsiderations: [
      "Sodium restriction to reduce fluid retention",
      "Taurine supplementation for cardiac muscle function",
      "L-carnitine for energy metabolism in heart muscle",
      "Omega-3 fatty acids for anti-arrhythmic effects",
    ],
    monitoringParameters: ["heart rate", "blood pressure", "chest x-rays", "echocardiogram"],
  },
  {
    conditionId: "diabetes",
    conditionName: "Diabetes",
    modifiedStandards: {
      fiber: { max: 15.0 },
      protein: { min: 25.0 },
      fat: { min: 5.5, max: 12.0 },
    },
    criticalNutrients: ["fiber", "protein", "chromium"],
    restrictedNutrients: ["simple-carbohydrates", "high-glycemic-foods"],
    recommendedNutrients: ["complex-carbohydrates", "chromium", "fiber", "antioxidants"],
    specialConsiderations: [
      "High fiber content to slow glucose absorption",
      "Complex carbohydrates for steady glucose release",
      "Consistent meal timing with insulin administration",
      "Weight management to improve insulin sensitivity",
    ],
    monitoringParameters: ["blood glucose", "fructosamine", "body weight", "urine glucose"],
  },
  {
    conditionId: "pancreatitis",
    conditionName: "Pancreatitis",
    modifiedStandards: {
      fat: { min: 3.0, max: 8.0 },
      fiber: { min: 4.0, max: 10.0 },
      protein: { min: 22.0 },
    },
    criticalNutrients: ["fat", "fiber", "digestibility"],
    restrictedNutrients: ["fat", "rich-foods", "fatty-acids"],
    recommendedNutrients: ["easily-digestible-protein", "prebiotics", "antioxidants"],
    specialConsiderations: [
      "Severe fat restriction to reduce pancreatic stimulation",
      "Highly digestible ingredients to reduce pancreatic workload",
      "Small, frequent meals to aid digestion",
      "Avoid fatty treats and table scraps completely",
    ],
    monitoringParameters: ["lipase", "amylase", "abdominal pain", "appetite", "stool quality"],
  },
]

export interface NutritionalComplianceResult {
  compliant: boolean
  violations: Array<{
    nutrient: string
    actual: number
    required: { min?: number; max?: number }
    severity: "critical" | "moderate" | "minor"
    recommendation: string
  }>
  warnings: Array<{
    nutrient: string
    message: string
    recommendation: string
  }>
  score: number // 0-100
}

export function analyzeMedicalNutritionalCompliance(
  diet: Recipe | PrescriptionDiet,
  conditionId: string,
): NutritionalComplianceResult {
  const profile = medicalNutritionalProfiles.find((p) => p.conditionId === conditionId)
  if (!profile) {
    return {
      compliant: false,
      violations: [
        {
          nutrient: "profile",
          actual: 0,
          required: {},
          severity: "critical",
          recommendation: "Medical profile not found",
        },
      ],
      warnings: [],
      score: 0,
    }
  }

  const violations: NutritionalComplianceResult["violations"] = []
  const warnings: NutritionalComplianceResult["warnings"] = []

  // Check modified standards
  Object.entries(profile.modifiedStandards).forEach(([nutrient, requirements]) => {
    const actualValue = getDietNutrientValue(diet, nutrient)

    if (actualValue === null) {
      warnings.push({
        nutrient,
        message: `${nutrient} value not available`,
        recommendation: `Request ${nutrient} analysis from manufacturer`,
      })
      return
    }

    if (requirements.min && actualValue < requirements.min) {
      violations.push({
        nutrient,
        actual: actualValue,
        required: requirements,
        severity: profile.criticalNutrients.includes(nutrient) ? "critical" : "moderate",
        recommendation: `Increase ${nutrient} to at least ${requirements.min}%`,
      })
    }

    if (requirements.max && actualValue > requirements.max) {
      violations.push({
        nutrient,
        actual: actualValue,
        required: requirements,
        severity: profile.restrictedNutrients.includes(nutrient) ? "critical" : "moderate",
        recommendation: `Reduce ${nutrient} to no more than ${requirements.max}%`,
      })
    }
  })

  // Calculate compliance score
  const totalChecks = Object.keys(profile.modifiedStandards).length
  const criticalViolations = violations.filter((v) => v.severity === "critical").length
  const moderateViolations = violations.filter((v) => v.severity === "moderate").length

  let score = 100
  score -= criticalViolations * 25 // Critical violations: -25 points each
  score -= moderateViolations * 10 // Moderate violations: -10 points each
  score -= warnings.length * 5 // Warnings: -5 points each

  score = Math.max(0, score)

  return {
    compliant: violations.filter((v) => v.severity === "critical").length === 0,
    violations,
    warnings,
    score,
  }
}

function getDietNutrientValue(diet: Recipe | PrescriptionDiet, nutrient: string): number | null {
  // Map nutrient names to diet properties
  const nutrientMap: { [key: string]: keyof (Recipe | PrescriptionDiet) } = {
    protein: "protein" as keyof Recipe,
    fat: "fat" as keyof Recipe,
    fiber: "fiber" as keyof Recipe,
    calcium: "calcium" as keyof Recipe,
    phosphorus: "phosphorus" as keyof Recipe,
  }

  // For prescription diets, use nutritionalProfile
  if ("nutritionalProfile" in diet) {
    const profileMap: { [key: string]: keyof typeof diet.nutritionalProfile } = {
      protein: "protein",
      fat: "fat",
      fiber: "fiber",
      phosphorus: "phosphorus",
      sodium: "sodium",
      potassium: "potassium",
      calcium: "calcium",
    }

    const profileKey = profileMap[nutrient]
    if (profileKey) {
      return diet.nutritionalProfile[profileKey]
    }
  }

  // For regular recipes
  const dietKey = nutrientMap[nutrient]
  if (dietKey && dietKey in diet) {
    return diet[dietKey] as number
  }

  return null
}

export function generateMedicalNutritionalReport(
  diet: Recipe | PrescriptionDiet,
  conditionId: string,
): {
  profile: MedicalNutritionalProfile
  compliance: NutritionalComplianceResult
  recommendations: string[]
  educationalContent: string[]
} {
  const profile = medicalNutritionalProfiles.find((p) => p.conditionId === conditionId)!
  const compliance = analyzeMedicalNutritionalCompliance(diet, conditionId)

  const recommendations: string[] = []
  const educationalContent: string[] = []

  // Generate specific recommendations based on violations
  compliance.violations.forEach((violation) => {
    recommendations.push(violation.recommendation)
  })

  // Add general recommendations for the condition
  profile.specialConsiderations.forEach((consideration) => {
    educationalContent.push(consideration)
  })

  // Add monitoring recommendations
  recommendations.push(
    `Regular monitoring of ${profile.monitoringParameters.join(", ")} is recommended for dogs with ${profile.conditionName.toLowerCase()}.`,
  )

  return {
    profile,
    compliance,
    recommendations,
    educationalContent,
  }
}

export function compareDietToStandard(
  diet: Recipe | PrescriptionDiet,
  standard: AAFCOStandards,
): {
  nutrient: string
  actual: number | null
  min?: number
  max?: number
  status: "compliant" | "below-min" | "above-max" | "unknown"
  percentage: number // How close to optimal range (0-100)
}[] {
  const results: ReturnType<typeof compareDietToStandard> = []

  Object.entries(standard).forEach(([nutrient, requirements]) => {
    const actual = getDietNutrientValue(diet, nutrient)
    let status: "compliant" | "below-min" | "above-max" | "unknown" = "unknown"
    let percentage = 0

    if (actual !== null) {
      if (requirements.min && actual < requirements.min) {
        status = "below-min"
        percentage = (actual / requirements.min) * 100
      } else if (requirements.max && actual > requirements.max) {
        status = "above-max"
        percentage = Math.max(0, 100 - ((actual - requirements.max) / requirements.max) * 100)
      } else {
        status = "compliant"
        percentage = 100
      }
    }

    results.push({
      nutrient,
      actual,
      min: requirements.min,
      max: requirements.max,
      status,
      percentage: Math.round(percentage),
    })
  })

  return results
}
