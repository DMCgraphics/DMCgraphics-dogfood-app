import type { MultiDogProfile, AIRecommendation } from "@/lib/multi-dog-types"
import { mockRecipes } from "@/lib/nutrition-calculator"
import { prescriptionDiets } from "@/lib/prescription-diets"

export function generateAIMealRecommendations(dogs: MultiDogProfile[]): AIRecommendation[] {
  return dogs.map((dog) => {
    const recommendations: AIRecommendation = {
      dogId: dog.id,
      dogName: dog.name,
      recommendedRecipes: [],
      reasoning: "",
      confidence: 0,
      nutritionalFocus: [],
    }

    // Check for medical conditions first
    if (dog.medicalNeeds?.selectedCondition && dog.medicalNeeds.selectedCondition !== "other") {
      const prescriptionDiet = prescriptionDiets.find((d) =>
        d.conditions.includes(dog.medicalNeeds!.selectedCondition!),
      )
      if (prescriptionDiet) {
        recommendations.recommendedRecipes = [prescriptionDiet.id]
        recommendations.reasoning = `Prescription diet recommended for ${dog.medicalNeeds.selectedCondition}. This therapeutic formula is specifically designed to support your dog's medical condition.`
        recommendations.confidence = 95
        recommendations.nutritionalFocus = ["medical-support", "therapeutic-nutrition"]
        return recommendations
      }
    }

    // AI logic for regular meal recommendations
    const availableRecipes = mockRecipes.filter((recipe) => {
      // Filter out allergens
      if (dog.selectedAllergens?.length) {
        return !recipe.allergens.some((allergen) => dog.selectedAllergens!.includes(allergen))
      }
      return true
    })

    const scoredRecipes = availableRecipes.map((recipe) => {
      let score = 50 // base score
      const reasoning: string[] = []
      const nutritionalFocus: string[] = []

      // Age-based recommendations
      if (dog.age && dog.ageUnit) {
        const ageInMonths = dog.ageUnit === "years" ? dog.age * 12 : dog.age
        if (ageInMonths < 12) {
          // Puppy - higher protein and calories
          if (recipe.protein >= 45) {
            score += 15
            reasoning.push("high protein for growing puppy")
            nutritionalFocus.push("growth-support")
          }
        } else if (ageInMonths > 84) {
          // Senior - easier digestion
          if (recipe.fiber >= 8) {
            score += 10
            reasoning.push("higher fiber for senior digestion")
            nutritionalFocus.push("digestive-health")
          }
        }
      }

      // Activity level recommendations
      if (dog.activity === "high" && recipe.kcalPer100g >= 170) {
        score += 12
        reasoning.push("higher calories for active lifestyle")
        nutritionalFocus.push("energy-support")
      } else if (dog.activity === "low" && recipe.kcalPer100g <= 160) {
        score += 10
        reasoning.push("moderate calories for less active dogs")
        nutritionalFocus.push("weight-management")
      }

      // Body condition recommendations
      if (dog.bodyCondition) {
        if (dog.bodyCondition <= 3 && recipe.fat >= 15) {
          score += 15
          reasoning.push("higher fat content to support healthy weight gain")
          nutritionalFocus.push("weight-gain")
        } else if (dog.bodyCondition >= 7 && recipe.fat <= 15) {
          score += 12
          reasoning.push("lower fat content for weight management")
          nutritionalFocus.push("weight-loss")
        }
      }

      // Health goals recommendations
      if (dog.healthGoals) {
        if (dog.healthGoals.skinCoat && recipe.epa + recipe.dha >= 100) {
          score += 10
          reasoning.push("omega fatty acids for skin and coat health")
          nutritionalFocus.push("skin-coat-support")
        }
        if (dog.healthGoals.joints && recipe.protein >= 45) {
          score += 8
          reasoning.push("high-quality protein for joint support")
          nutritionalFocus.push("joint-support")
        }
        if (dog.healthGoals.digestiveHealth && recipe.fiber >= 8) {
          score += 10
          reasoning.push("optimal fiber for digestive health")
          nutritionalFocus.push("digestive-support")
        }
      }

      // Breed-specific recommendations (simplified)
      if (dog.breed) {
        const largeBreedsKeywords = ["German Shepherd", "Golden Retriever", "Labrador", "Great Dane", "Mastiff"]
        const smallBreedsKeywords = ["Chihuahua", "Yorkshire", "Maltese", "Pomeranian", "Papillon"]

        if (largeBreedsKeywords.some((keyword) => dog.breed.includes(keyword))) {
          if (recipe.calcium >= 1200 && recipe.phosphorus >= 900) {
            score += 8
            reasoning.push("balanced calcium/phosphorus for large breed bone health")
            nutritionalFocus.push("bone-health")
          }
        } else if (smallBreedsKeywords.some((keyword) => dog.breed.includes(keyword))) {
          if (recipe.kcalPer100g >= 165) {
            score += 6
            reasoning.push("nutrient-dense formula ideal for small breeds")
            nutritionalFocus.push("small-breed-nutrition")
          }
        }
      }

      return {
        recipe,
        score,
        reasoning: reasoning.join(", "),
        nutritionalFocus,
      }
    })

    // Sort by score and take top recommendations
    scoredRecipes.sort((a, b) => b.score - a.score)
    const topRecipes = scoredRecipes.slice(0, 2)

    recommendations.recommendedRecipes = topRecipes.map((r) => r.recipe.id)

    const primaryBenefits = topRecipes[0].reasoning || "balanced nutrition for optimal health"
    recommendations.reasoning = `Based on ${dog.name}'s profile (${dog.age} ${dog.ageUnit} old, ${dog.activity} activity, ${dog.breed}), I recommend these recipes because they provide ${primaryBenefits}.`

    recommendations.confidence = Math.min(95, Math.max(60, topRecipes[0].score))

    const allFocusAreas = [...new Set(topRecipes.flatMap((r) => r.nutritionalFocus))]
    if (allFocusAreas.length === 0) {
      // Add default focus areas based on dog profile
      if (dog.age && dog.ageUnit === "years" && dog.age > 7) {
        allFocusAreas.push("senior-support")
      }
      if (dog.activity === "high") {
        allFocusAreas.push("energy-support")
      }
      if (dog.activity === "moderate") {
        allFocusAreas.push("balanced-nutrition")
      }
      if (dog.activity === "low") {
        allFocusAreas.push("weight-management")
      }
      // Always include general health support
      allFocusAreas.push("overall-health")
    }
    recommendations.nutritionalFocus = allFocusAreas

    return recommendations
  })
}

export function generateMealVarietyRecommendations(dogs: MultiDogProfile[]): {
  sharedMeals: string[]
  individualMeals: { dogId: string; recipes: string[] }[]
  reasoning: string
} {
  const aiRecommendations = generateAIMealRecommendations(dogs)

  // Find recipes that work for multiple dogs
  const allRecommendedRecipes = aiRecommendations.flatMap((rec) => rec.recommendedRecipes)
  const recipeFrequency = allRecommendedRecipes.reduce(
    (acc, recipeId) => {
      acc[recipeId] = (acc[recipeId] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const sharedMeals = Object.entries(recipeFrequency)
    .filter(([_, count]) => count > 1)
    .map(([recipeId]) => recipeId)

  const individualMeals = aiRecommendations
    .filter((rec) => rec.recommendedRecipes.some((recipeId) => !sharedMeals.includes(recipeId)))
    .map((rec) => ({
      dogId: rec.dogId,
      recipes: rec.recommendedRecipes.filter((recipeId) => !sharedMeals.includes(recipeId)),
    }))

  let reasoning = ""
  if (sharedMeals.length > 0) {
    reasoning += `${sharedMeals.length} recipe(s) work well for multiple dogs in your pack. `
  }
  if (individualMeals.length > 0) {
    reasoning += `${individualMeals.length} dog(s) have specific nutritional needs requiring individual recipes.`
  }

  return {
    sharedMeals,
    individualMeals,
    reasoning: reasoning || "All dogs can share the same meals based on their similar nutritional needs.",
  }
}
