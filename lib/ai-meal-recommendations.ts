import type {
  MultiDogProfile,
  AIRecommendation,
  ScoringFactor,
  ConfidenceBreakdown,
  AlternativeRecommendation,
} from "@/lib/multi-dog-types"
import { mockRecipes } from "@/lib/nutrition-calculator"
import { prescriptionDiets } from "@/lib/prescription-diets"
import { calculateConfidence } from "@/lib/ai/confidence-calculator"

export function generateAIMealRecommendations(dogs: MultiDogProfile[]): AIRecommendation[] {
  return dogs.map((dog) => {
    console.log("[v0] AI Recommendations - Dog profile:", {
      name: dog.name,
      hasHealthGoals: !!dog.healthGoals,
      healthGoals: dog.healthGoals,
      hasPortions: !!dog.portions,
      portions: dog.portions,
      weight: dog.weight,
      weightUnit: dog.weightUnit,
    })

    const recommendations: AIRecommendation = {
      dogId: dog.id,
      dogName: dog.name,
      recommendedRecipes: [],
      reasoning: "",
      confidence: 0,
      nutritionalFocus: [],
      factorsConsidered: [],
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
        recommendations.factorsConsidered = [
          {
            factor: "Prescription Medical Diet",
            points: 95,
            description: `Veterinary therapeutic formula for ${dog.medicalNeeds.selectedCondition}`,
            impact: "high",
            category: "health",
          },
        ]
        const prescConfidenceResult = calculateConfidence(95)
        recommendations.confidenceBreakdown = {
          baseScore: 95,
          adjustments: [],
          totalScore: 95,
          confidenceLevel: prescConfidenceResult.label as any,
        }
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
      const scoringFactors: ScoringFactor[] = []

      // Age-based recommendations
      if (dog.age && dog.ageUnit) {
        const ageInMonths = dog.ageUnit === "years" ? dog.age * 12 : dog.age
        if (ageInMonths < 12) {
          // Puppy - higher protein and calories
          if (recipe.protein >= 45) {
            score += 15
            reasoning.push("high protein for growing puppy")
            nutritionalFocus.push("growth-support")
            scoringFactors.push({
              factor: "Puppy Growth Nutrition",
              points: 15,
              description: `High protein (${recipe.protein}%) supports rapid growth phase`,
              impact: "high",
              category: "age",
            })
          }
        } else if (ageInMonths > 84) {
          // Senior - easier digestion
          if (recipe.fiber >= 8) {
            score += 10
            reasoning.push("higher fiber for senior digestion")
            nutritionalFocus.push("digestive-health")
            scoringFactors.push({
              factor: "Senior Digestive Support",
              points: 10,
              description: `Higher fiber (${recipe.fiber}%) aids senior digestion`,
              impact: "medium",
              category: "age",
            })
          }
        }
      }

      // Activity level recommendations
      if (dog.activity === "high" && recipe.kcalPer100g >= 170) {
        score += 12
        reasoning.push("higher calories for active lifestyle")
        nutritionalFocus.push("energy-support")
        scoringFactors.push({
          factor: "High Activity Energy",
          points: 12,
          description: `Calorie-dense (${recipe.kcalPer100g} kcal/100g) for active lifestyle`,
          impact: "high",
          category: "activity",
        })
      } else if (dog.activity === "low" && recipe.kcalPer100g <= 160) {
        score += 10
        reasoning.push("moderate calories for less active dogs")
        nutritionalFocus.push("weight-management")
        scoringFactors.push({
          factor: "Low Activity Portion Control",
          points: 10,
          description: `Moderate calories (${recipe.kcalPer100g} kcal/100g) for less active dogs`,
          impact: "medium",
          category: "activity",
        })
      }

      // Body condition recommendations
      if (dog.bodyCondition) {
        if (dog.bodyCondition <= 3 && recipe.fat >= 15) {
          score += 15
          reasoning.push("higher fat content to support healthy weight gain")
          nutritionalFocus.push("weight-gain")
          scoringFactors.push({
            factor: "Underweight - Weight Gain Support",
            points: 15,
            description: `Higher fat (${recipe.fat}%) for healthy weight gain (body condition: ${dog.bodyCondition}/9)`,
            impact: "high",
            category: "weight",
          })
        } else if (dog.bodyCondition >= 7 && recipe.fat <= 15) {
          score += 12
          reasoning.push("lower fat content for weight management")
          nutritionalFocus.push("weight-loss")
          scoringFactors.push({
            factor: "Overweight - Weight Management",
            points: 12,
            description: `Lower fat (${recipe.fat}%) for weight management (body condition: ${dog.bodyCondition}/9)`,
            impact: "high",
            category: "weight",
          })
        }
      }

      // Health goals recommendations
      if (dog.healthGoals) {
        if (dog.healthGoals.skinCoat && recipe.epa + recipe.dha >= 100) {
          score += 10
          reasoning.push("omega fatty acids for skin and coat health")
          nutritionalFocus.push("skin-coat-support")
          scoringFactors.push({
            factor: "Skin & Coat Health",
            points: 10,
            description: `Omega-3s (${recipe.epa + recipe.dha}mg) support healthy skin and coat`,
            impact: "medium",
            category: "health",
          })
        }
        if (dog.healthGoals.joints && recipe.protein >= 45) {
          score += 8
          reasoning.push("high-quality protein for joint support")
          nutritionalFocus.push("joint-support")
          scoringFactors.push({
            factor: "Joint Health Support",
            points: 8,
            description: `High protein (${recipe.protein}%) maintains muscle to support joints`,
            impact: "medium",
            category: "health",
          })
        }
        if (dog.healthGoals.digestiveHealth && recipe.fiber >= 8) {
          score += 10
          reasoning.push("optimal fiber for digestive health")
          nutritionalFocus.push("digestive-support")
          scoringFactors.push({
            factor: "Digestive Health",
            points: 10,
            description: `Optimal fiber (${recipe.fiber}%) promotes healthy digestion`,
            impact: "medium",
            category: "health",
          })
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
            scoringFactors.push({
              factor: "Large Breed Bone Health",
              points: 8,
              description: `Balanced Ca:P ratio (${recipe.calcium}:${recipe.phosphorus}mg) for large breed joints`,
              impact: "medium",
              category: "breed",
            })
          }
        } else if (smallBreedsKeywords.some((keyword) => dog.breed.includes(keyword))) {
          if (recipe.kcalPer100g >= 165) {
            score += 6
            reasoning.push("nutrient-dense formula ideal for small breeds")
            nutritionalFocus.push("small-breed-nutrition")
            scoringFactors.push({
              factor: "Small Breed Nutrient Density",
              points: 6,
              description: `Nutrient-dense (${recipe.kcalPer100g} kcal/100g) ideal for small breed metabolism`,
              impact: "low",
              category: "breed",
            })
          }
        }
      }

      // Target weight and weight goal recommendations
      if (dog.healthGoals?.targetWeight && dog.weight && dog.weightUnit) {
        const currentWeight = dog.weight
        const targetWeight = dog.healthGoals.targetWeight
        const weightGoal = dog.healthGoals.weightGoal
        const weightDifference = Math.abs(currentWeight - targetWeight)
        const weightChangePercentage = (weightDifference / currentWeight) * 100

        if (weightGoal === "lose" && currentWeight > targetWeight) {
          // Weight loss recommendations
          if (recipe.fat <= 12 && recipe.fiber >= 8) {
            score += 18
            reasoning.push(`lower fat (${recipe.fat}%) and higher fiber for weight loss goal`)
            nutritionalFocus.push("weight-loss")
            scoringFactors.push({
              factor: "Weight Loss Formula",
              points: 18,
              description: `Lower fat (${recipe.fat}%) + higher fiber (${recipe.fiber}%) for weight loss (${currentWeight}→${targetWeight} ${dog.weightUnit})`,
              impact: "high",
              category: "weight",
            })
          }
          if (recipe.protein >= 25) {
            score += 12
            reasoning.push("higher protein to maintain muscle during weight loss")
            nutritionalFocus.push("muscle-maintenance")
            scoringFactors.push({
              factor: "Muscle Maintenance During Weight Loss",
              points: 12,
              description: `High protein (${recipe.protein}%) preserves lean muscle mass`,
              impact: "high",
              category: "weight",
            })
          }
          if (recipe.kcalPer100g <= 155) {
            score += 15
            reasoning.push("lower calorie density for weight management")
            nutritionalFocus.push("calorie-control")
            scoringFactors.push({
              factor: "Calorie Control",
              points: 15,
              description: `Lower calorie density (${recipe.kcalPer100g} kcal/100g) for portion control`,
              impact: "high",
              category: "weight",
            })
          }
        } else if (weightGoal === "gain" && currentWeight < targetWeight) {
          // Weight gain recommendations
          if (recipe.fat >= 15 && recipe.protein >= 25) {
            score += 16
            reasoning.push(`higher fat (${recipe.fat}%) and protein for healthy weight gain`)
            nutritionalFocus.push("weight-gain")
            scoringFactors.push({
              factor: "Weight Gain Formula",
              points: 16,
              description: `Higher fat (${recipe.fat}%) + protein (${recipe.protein}%) for healthy weight gain (${currentWeight}→${targetWeight} ${dog.weightUnit})`,
              impact: "high",
              category: "weight",
            })
          }
          if (recipe.kcalPer100g >= 170) {
            score += 14
            reasoning.push("higher calorie density to support weight gain")
            nutritionalFocus.push("calorie-dense")
            scoringFactors.push({
              factor: "Calorie Dense for Weight Gain",
              points: 14,
              description: `High calorie density (${recipe.kcalPer100g} kcal/100g) supports weight gain`,
              impact: "high",
              category: "weight",
            })
          }
        } else if (weightGoal === "maintain") {
          // Weight maintenance recommendations
          if (recipe.fat >= 12 && recipe.fat <= 16) {
            score += 10
            reasoning.push("balanced fat content for weight maintenance")
            nutritionalFocus.push("weight-maintenance")
            scoringFactors.push({
              factor: "Weight Maintenance Balance",
              points: 10,
              description: `Balanced fat (${recipe.fat}%) for maintaining ${targetWeight} ${dog.weightUnit}`,
              impact: "medium",
              category: "weight",
            })
          }
          if (recipe.kcalPer100g >= 160 && recipe.kcalPer100g <= 170) {
            score += 8
            reasoning.push("moderate calorie density for stable weight")
            nutritionalFocus.push("balanced-nutrition")
            scoringFactors.push({
              factor: "Stable Calorie Balance",
              points: 8,
              description: `Moderate calories (${recipe.kcalPer100g} kcal/100g) for stable weight`,
              impact: "medium",
              category: "weight",
            })
          }
        }

        // Add urgency scoring based on how far from target weight
        if (weightChangePercentage > 15) {
          score += 5 // More urgent weight management needed
          reasoning.push("prioritized for significant weight adjustment needed")
          scoringFactors.push({
            factor: "Significant Weight Adjustment Priority",
            points: 5,
            description: `Urgent weight management needed (${weightChangePercentage.toFixed(1)}% change)`,
            impact: "low",
            category: "weight",
          })
        }
      }

      // Portion size considerations based on target weight
      if (dog.healthGoals?.targetWeight && dog.portions) {
        const currentPortions = dog.portions
        // Adjust recommendations based on current portion sizes and weight goals
        if (dog.healthGoals.weightGoal === "lose" && currentPortions.dailyCalories) {
          // Recommend recipes that work well with reduced portions
          if (recipe.protein >= 25 && recipe.fiber >= 6) {
            score += 8
            reasoning.push("high protein and fiber to maintain satiety with smaller portions")
            nutritionalFocus.push("portion-optimization")
            scoringFactors.push({
              factor: "Portion Satiety",
              points: 8,
              description: `Protein (${recipe.protein}%) + fiber (${recipe.fiber}%) keeps ${dog.name} satisfied with smaller portions`,
              impact: "medium",
              category: "portions",
            })
          }
        } else if (dog.healthGoals.weightGoal === "gain" && currentPortions.dailyCalories) {
          // Recommend calorie-dense recipes for easier portion increases
          if (recipe.kcalPer100g >= 170) {
            score += 10
            reasoning.push("calorie-dense formula allows smaller volume increases")
            nutritionalFocus.push("efficient-portions")
            scoringFactors.push({
              factor: "Efficient Portion Increases",
              points: 10,
              description: `Calorie-dense (${recipe.kcalPer100g} kcal/100g) allows smaller portion increases`,
              impact: "medium",
              category: "portions",
            })
          }
        }
      }

      return {
        recipe,
        score,
        reasoning: reasoning.join(", "),
        nutritionalFocus,
        scoringFactors,
      }
    })

    // Sort by score and take top recommendations
    scoredRecipes.sort((a, b) => b.score - a.score)
    const topRecipes = scoredRecipes.slice(0, 2)

    recommendations.recommendedRecipes = topRecipes.map((r) => r.recipe.id)

    const primaryBenefits = topRecipes[0].reasoning || "balanced nutrition for optimal health"

    let reasoningText = `Based on ${dog.name}'s profile (${dog.age} ${dog.ageUnit} old, ${dog.activity} activity, ${dog.breed})`

    console.log("[v0] Target weight check:", {
      hasTargetWeight: !!dog.healthGoals?.targetWeight,
      targetWeight: dog.healthGoals?.targetWeight,
      currentWeight: dog.weight,
      weightGoal: dog.healthGoals?.weightGoal,
    })

    if (dog.healthGoals?.targetWeight && dog.weight) {
      const weightGoal = dog.healthGoals.weightGoal
      const currentWeight = dog.weight
      const targetWeight = dog.healthGoals.targetWeight

      if (weightGoal === "lose") {
        reasoningText += ` and weight loss goal (${currentWeight} → ${targetWeight} ${dog.weightUnit})`
      } else if (weightGoal === "gain") {
        reasoningText += ` and weight gain goal (${currentWeight} → ${targetWeight} ${dog.weightUnit})`
      } else if (weightGoal === "maintain") {
        reasoningText += ` and weight maintenance goal (${targetWeight} ${dog.weightUnit})`
      }
    }

    console.log("[v0] Portion check:", {
      hasPortions: !!dog.portions?.dailyCalories,
      dailyCalories: dog.portions?.dailyCalories,
    })

    if (dog.portions?.dailyCalories) {
      reasoningText += ` and current portion plan (${dog.portions.dailyCalories} kcal/day)`
    }

    recommendations.reasoning = `${reasoningText}, I recommend these recipes because they provide ${primaryBenefits}.`

    console.log("[v0] Final reasoning text:", recommendations.reasoning)

    // Only apply 60% minimum if we have sufficient data (weight, age, and at least one of: activity, breed, or bodyCondition)
    const hasSufficientData = dog.weight && dog.age && (dog.activity || dog.breed || dog.bodyCondition)
    const minConfidence = hasSufficientData ? 60 : 0
    recommendations.confidence = Math.min(95, Math.max(minConfidence, topRecipes[0].score))

    // Build comprehensive confidence breakdown
    const topScoringFactors = topRecipes[0].scoringFactors
      .sort((a, b) => b.points - a.points)
      .slice(0, 5) // Top 5 factors

    const confidenceResult = calculateConfidence(recommendations.confidence)

    const confidenceBreakdown: ConfidenceBreakdown = {
      baseScore: 50,
      adjustments: topScoringFactors.map((factor) => ({
        factor: factor.factor,
        points: factor.points,
        description: factor.description,
        impact: factor.impact,
      })),
      totalScore: recommendations.confidence,
      confidenceLevel: confidenceResult.label as any,
    }

    recommendations.confidenceBreakdown = confidenceBreakdown
    recommendations.factorsConsidered = topRecipes[0].scoringFactors

    // Detect missing data that could improve confidence
    const missingData: string[] = []
    if (!dog.breed) {
      missingData.push("Breed information for breed-specific recommendations")
    }
    if (!dog.bodyCondition) {
      missingData.push("Body condition score for weight management guidance")
    }
    if (!dog.healthGoals || Object.keys(dog.healthGoals).length === 0) {
      missingData.push("Health goals for targeted nutrition")
    }
    if (!dog.selectedAllergens || dog.selectedAllergens.length === 0) {
      // This is actually good, but we note it as "complete"
    }
    recommendations.missingData = missingData

    // Flag edge cases
    const edgeCases: string[] = []
    if (
      dog.healthGoals?.targetWeight &&
      dog.weight &&
      dog.weightUnit
    ) {
      const weightChangePercentage =
        (Math.abs(dog.weight - dog.healthGoals.targetWeight) / dog.weight) * 100
      if (weightChangePercentage > 20) {
        edgeCases.push(
          `Significant weight change goal (${weightChangePercentage.toFixed(1)}%) - veterinary consultation recommended`
        )
      }
    }
    if (dog.selectedAllergens && dog.selectedAllergens.length >= 3) {
      edgeCases.push(`Multiple allergen restrictions (${dog.selectedAllergens.length}) may limit recipe options`)
    }
    if (dog.age && dog.ageUnit) {
      const ageInMonths = dog.ageUnit === "years" ? dog.age * 12 : dog.age
      if (ageInMonths < 6) {
        edgeCases.push("Very young puppy - consult veterinarian for specialized puppy nutrition")
      }
    }
    recommendations.edgeCases = edgeCases.length > 0 ? edgeCases : undefined

    // Generate alternative recommendations (recipes 2-4)
    if (scoredRecipes.length > 2) {
      const alternatives: AlternativeRecommendation[] = scoredRecipes
        .slice(2, 5) // Get recipes 2-4 (indices 2, 3, 4)
        .map((scoredRecipe) => {
          const confidenceDiff = topRecipes[0].score - scoredRecipe.score
          const topFactors = scoredRecipe.scoringFactors
            .sort((a, b) => b.points - a.points)
            .slice(0, 2)

          return {
            recipeId: scoredRecipe.recipe.id,
            recipeName: scoredRecipe.recipe.name,
            confidence: Math.min(95, Math.max(60, scoredRecipe.score)),
            reasoning: scoredRecipe.reasoning || "Balanced nutrition",
            differenceFromTop: `${confidenceDiff} points lower - ${topFactors.map((f) => f.factor).join(", ")}`,
          }
        })

      recommendations.alternativeRecommendations = alternatives
    }

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
