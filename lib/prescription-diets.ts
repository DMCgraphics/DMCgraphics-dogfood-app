export interface MedicalCondition {
  id: string
  name: string
  description: string
  dietaryRestrictions: string[]
  requiredNutrients: {
    [key: string]: { min?: number; max?: number; target?: number }
  }
  contraindications: string[]
}

export interface PrescriptionDiet {
  id: string
  name: string
  conditionId: string
  description: string
  image: string
  ingredients: Array<{
    name: string
    percentage: number
    purpose: string
  }>
  nutritionalProfile: {
    protein: number
    fat: number
    fiber: number
    moisture: number
    ash: number
    calories: number
    phosphorus: number
    sodium: number
    potassium: number
    calcium: number
  }
  vetApproved: boolean
  prescriptionRequired: boolean
  availabilityStatus: "available" | "coming-soon" | "vet-only"
}

export const medicalConditions: MedicalCondition[] = [
  {
    id: "kidney-disease",
    name: "Kidney Disease",
    description: "Chronic kidney disease requiring reduced phosphorus and protein",
    dietaryRestrictions: ["high-phosphorus", "excessive-protein"],
    requiredNutrients: {
      protein: { min: 14, max: 18 },
      phosphorus: { max: 0.4 },
      sodium: { max: 0.3 },
      omega3: { min: 0.4 },
    },
    contraindications: ["organ-meat", "fish-meal", "bone-meal"],
  },
  {
    id: "liver-disease",
    name: "Liver Disease",
    description: "Hepatic conditions requiring modified protein and copper restriction",
    dietaryRestrictions: ["high-copper", "poor-quality-protein"],
    requiredNutrients: {
      protein: { min: 16, max: 20 },
      copper: { max: 7 },
      zinc: { min: 120 },
      vitamin_e: { min: 60 },
    },
    contraindications: ["organ-meat", "shellfish", "nuts"],
  },
  {
    id: "heart-disease",
    name: "Heart Disease",
    description: "Cardiac conditions requiring sodium restriction and taurine support",
    dietaryRestrictions: ["high-sodium", "excessive-fat"],
    requiredNutrients: {
      sodium: { max: 0.25 },
      taurine: { min: 0.1 },
      carnitine: { min: 200 },
      omega3: { min: 0.4 },
    },
    contraindications: ["salt", "processed-meats", "high-sodium-vegetables"],
  },
  {
    id: "diabetes",
    name: "Diabetes",
    description: "Blood sugar management through controlled carbohydrates and fiber",
    dietaryRestrictions: ["simple-carbs", "high-glycemic"],
    requiredNutrients: {
      fiber: { min: 8, max: 15 },
      protein: { min: 25 },
      fat: { max: 12 },
      chromium: { min: 0.2 },
    },
    contraindications: ["corn-syrup", "white-rice", "potatoes"],
  },
  {
    id: "pancreatitis",
    name: "Pancreatitis",
    description: "Low-fat diet to reduce pancreatic stress and inflammation",
    dietaryRestrictions: ["high-fat", "rich-foods"],
    requiredNutrients: {
      fat: { max: 8 },
      fiber: { min: 4 },
      protein: { min: 22 },
      omega3: { min: 0.3 },
    },
    contraindications: ["fatty-meats", "oils", "nuts", "seeds"],
  },
]

export const prescriptionDiets: PrescriptionDiet[] = [
  {
    id: "renal-support",
    name: "Renal Support Formula",
    conditionId: "kidney-disease",
    description: "Veterinary-formulated low-phosphorus diet for kidney health support",
    image: "/placeholder.svg?height=300&width=300",
    ingredients: [
      { name: "White Fish", percentage: 35, purpose: "High-quality, easily digestible protein" },
      { name: "Sweet Potato", percentage: 20, purpose: "Low-phosphorus carbohydrate source" },
      { name: "Carrots", percentage: 15, purpose: "Beta-carotene and fiber" },
      { name: "Green Beans", percentage: 10, purpose: "Low-phosphorus vegetables" },
      { name: "Fish Oil", percentage: 8, purpose: "Omega-3 fatty acids for kidney support" },
      { name: "Rice", percentage: 7, purpose: "Easily digestible energy" },
      { name: "Vitamins & Minerals", percentage: 5, purpose: "Balanced nutrition without excess phosphorus" },
    ],
    nutritionalProfile: {
      protein: 16,
      fat: 12,
      fiber: 4,
      moisture: 78,
      ash: 4,
      calories: 95,
      phosphorus: 0.35,
      sodium: 0.25,
      potassium: 0.8,
      calcium: 0.6,
    },
    vetApproved: true,
    prescriptionRequired: true,
    availabilityStatus: "coming-soon",
  },
  {
    id: "hepatic-support",
    name: "Hepatic Support Formula",
    conditionId: "liver-disease",
    description: "Copper-restricted diet with high-quality protein for liver health",
    image: "/placeholder.svg?height=300&width=300",
    ingredients: [
      { name: "Chicken Breast", percentage: 30, purpose: "High-quality, low-copper protein" },
      { name: "White Rice", percentage: 25, purpose: "Easily digestible carbohydrate" },
      { name: "Cottage Cheese", percentage: 15, purpose: "Additional high-quality protein" },
      { name: "Carrots", percentage: 10, purpose: "Beta-carotene and antioxidants" },
      { name: "Green Peas", percentage: 8, purpose: "Fiber and B-vitamins" },
      { name: "Sunflower Oil", percentage: 7, purpose: "Essential fatty acids" },
      { name: "Vitamins & Minerals", percentage: 5, purpose: "Liver-specific nutrient blend" },
    ],
    nutritionalProfile: {
      protein: 18,
      fat: 8,
      fiber: 3,
      moisture: 75,
      ash: 5,
      calories: 88,
      phosphorus: 0.6,
      sodium: 0.3,
      potassium: 0.9,
      calcium: 0.8,
    },
    vetApproved: true,
    prescriptionRequired: true,
    availabilityStatus: "coming-soon",
  },
  {
    id: "cardiac-support",
    name: "Cardiac Support Formula",
    conditionId: "heart-disease",
    description: "Low-sodium diet with taurine and carnitine for heart health",
    image: "/placeholder.svg?height=300&width=300",
    ingredients: [
      { name: "Turkey Breast", percentage: 32, purpose: "Lean protein with natural taurine" },
      { name: "Brown Rice", percentage: 22, purpose: "Complex carbohydrates for energy" },
      { name: "Spinach", percentage: 12, purpose: "Potassium and magnesium" },
      { name: "Carrots", percentage: 10, purpose: "Antioxidants and fiber" },
      { name: "Fish Oil", percentage: 8, purpose: "Omega-3 for heart health" },
      { name: "Quinoa", percentage: 8, purpose: "Complete amino acid profile" },
      { name: "Taurine & L-Carnitine", percentage: 3, purpose: "Heart muscle support" },
      { name: "Vitamins & Minerals", percentage: 5, purpose: "Cardiac-specific nutrients" },
    ],
    nutritionalProfile: {
      protein: 22,
      fat: 10,
      fiber: 5,
      moisture: 76,
      ash: 4.5,
      calories: 92,
      phosphorus: 0.7,
      sodium: 0.2,
      potassium: 1.1,
      calcium: 0.9,
    },
    vetApproved: true,
    prescriptionRequired: true,
    availabilityStatus: "coming-soon",
  },
]

export function getPrescriptionDietsByCondition(conditionId: string): PrescriptionDiet[] {
  return prescriptionDiets.filter((diet) => diet.conditionId === conditionId)
}

export function getMedicalConditionById(id: string): MedicalCondition | undefined {
  return medicalConditions.find((condition) => condition.id === id)
}

export function validateNutritionalCompliance(
  diet: PrescriptionDiet,
  condition: MedicalCondition,
): {
  compliant: boolean
  violations: string[]
  recommendations: string[]
} {
  const violations: string[] = []
  const recommendations: string[] = []

  // Check required nutrients
  Object.entries(condition.requiredNutrients).forEach(([nutrient, requirements]) => {
    const dietValue = diet.nutritionalProfile[nutrient as keyof typeof diet.nutritionalProfile]

    if (requirements.min && dietValue < requirements.min) {
      violations.push(`${nutrient} below minimum requirement (${dietValue} < ${requirements.min})`)
    }

    if (requirements.max && dietValue > requirements.max) {
      violations.push(`${nutrient} exceeds maximum limit (${dietValue} > ${requirements.max})`)
    }

    if (requirements.target && Math.abs(dietValue - requirements.target) > requirements.target * 0.1) {
      recommendations.push(`Consider adjusting ${nutrient} closer to target value of ${requirements.target}`)
    }
  })

  return {
    compliant: violations.length === 0,
    violations,
    recommendations,
  }
}
