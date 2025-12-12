"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, Leaf, Sparkles, Grid3X3 } from "lucide-react"
import { mockRecipes, type DogProfile } from "@/lib/nutrition-calculator"
import { AIRecommendationCard } from "./ai-recommendation-card"
import { MultipleMealSelector } from "./multiple-meal-selector"
import { generateAIMealRecommendations } from "@/lib/ai-meal-recommendations"
import type { MultiDogProfile } from "@/lib/multi-dog-types"

interface Step4Props {
  selectedRecipe: string | null
  selectedRecipes?: string[]
  onUpdate: (recipeId: string) => void
  onUpdateMultiple?: (recipes: string[]) => void
  excludedAllergens: string[]
  dogProfile?: Partial<DogProfile>
  allowMultipleSelection?: boolean
}

export function Step4RecipeSelection({
  selectedRecipe,
  selectedRecipes = [],
  onUpdate,
  onUpdateMultiple,
  excludedAllergens,
  dogProfile,
  allowMultipleSelection = false,
}: Step4Props) {
  const [showAIRecommendations, setShowAIRecommendations] = useState(false)
  const [aiRecommendation, setAIRecommendation] = useState<any>(null)
  const [selectionMode, setSelectionMode] = useState<"single" | "multiple">(
    allowMultipleSelection ? "multiple" : "single",
  )

  // Sync selectionMode with allowMultipleSelection prop when it changes (e.g., in modify mode)
  useEffect(() => {
    if (allowMultipleSelection) {
      console.log("[v0] Recipe Selection - Switching to multiple mode (modify mode detected)")
      setSelectionMode("multiple")
    }
  }, [allowMultipleSelection])

  // Debug logging for selection mode
  useEffect(() => {
    console.log("[v0] Recipe Selection - Current mode:", selectionMode)
    console.log("[v0] Recipe Selection - Selected recipes:", selectedRecipes)
  }, [selectionMode, selectedRecipes])

  useEffect(() => {
    if (dogProfile && dogProfile.name && dogProfile.weight && dogProfile.breed) {
      const mockDog: MultiDogProfile = {
        id: "current-dog",
        name: dogProfile.name,
        weight: dogProfile.weight,
        weightUnit: dogProfile.weightUnit || "lb",
        age: dogProfile.age || 3,
        ageUnit: dogProfile.ageUnit || "years",
        sex: dogProfile.sex || "male",
        breed: dogProfile.breed,
        activity: dogProfile.activity || "moderate",
        bodyCondition: dogProfile.bodyCondition || 5,
        isNeutered: dogProfile.isNeutered ?? true,
        lifeStage: dogProfile.age && dogProfile.ageUnit === "years" && dogProfile.age < 1 ? "puppy" : "adult",
        selectedAllergens: excludedAllergens,
        healthGoals: dogProfile.healthGoals,
        portions: dogProfile.portions,
      }

      const recommendations = generateAIMealRecommendations([mockDog])
      if (recommendations.length > 0) {
        setAIRecommendation(recommendations[0])
      }
    }
  }, [dogProfile, excludedAllergens])

  // Filter recipes based on allergens and coming soon status
  const availableRecipes = mockRecipes.filter(
    (recipe) => !recipe.comingSoon && recipe.allergens.every((allergen) => !excludedAllergens.includes(allergen)),
  )

  const getRecipeImage = (recipeId: string) => {
    const imageMap: Record<string, string> = {
      "beef-quinoa-harvest": "/images/recipes/beef-quinoa.png",
      "lamb-pumpkin-feast": "/images/recipes/lamb-pumpkin.png",
      "low-fat-chicken-garden-veggie": "/images/recipes/low-fat-chicken-garden-veggie.png",
      "turkey-brown-rice-comfort": "/images/recipes/turkey-brown-rice.png",
    }
    return imageMap[recipeId] || "/placeholder.svg?height=200&width=300"
  }

  return (
    <div className="space-y-6">
      {excludedAllergens.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <div className="w-4 h-4 rounded-full bg-primary"></div>
              </div>
              <div>
                <h4 className="font-semibold">Allergy Guard Active</h4>
                <p className="text-sm text-muted-foreground">
                  Filtering out recipes with: {excludedAllergens.join(", ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {aiRecommendation && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Personalized for Your Dog</h3>
            <Button variant="outline" size="sm" onClick={() => setShowAIRecommendations(!showAIRecommendations)}>
              <Sparkles className="h-4 w-4 mr-2" />
              {showAIRecommendations ? "Hide" : "Show"} AI Recommendations
            </Button>
          </div>

          {showAIRecommendations && (
            <AIRecommendationCard
              recommendation={aiRecommendation}
              onSelectRecipe={onUpdate}
              selectedRecipe={selectedRecipe}
            />
          )}
        </div>
      )}

      {allowMultipleSelection && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Meal Selection Mode</h4>
                <p className="text-sm text-muted-foreground">Choose one recipe or multiple for variety</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectionMode === "single" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectionMode("single")}
                >
                  Single Recipe
                </Button>
                <Button
                  variant={selectionMode === "multiple" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectionMode("multiple")}
                >
                  <Grid3X3 className="h-4 w-4 mr-1" />
                  Multiple Recipes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectionMode === "multiple" && onUpdateMultiple ? (
        <MultipleMealSelector
          selectedRecipes={selectedRecipes}
          onUpdate={onUpdateMultiple}
          excludedAllergens={excludedAllergens}
          maxSelections={3}
        />
      ) : (
        <div className="grid gap-6">
          {availableRecipes.map((recipe) => (
            <Card
              key={recipe.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedRecipe === recipe.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => onUpdate(recipe.id)}
            >
              <CardContent className="p-0">
                <div className="grid md:grid-cols-3 gap-6 p-6">
                  {/* Recipe Image */}
                  <div className="relative">
                    <img
                      src={getRecipeImage(recipe.id) || "/placeholder.svg"}
                      alt={recipe.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    {selectedRecipe === recipe.id && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                    {recipe.comingSoon && (
                      <span className="absolute top-2 left-2 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-1">
                        Coming Soon
                      </span>
                    )}
                    {!recipe.comingSoon && (
                      <Badge className="absolute bottom-2 left-2" variant="secondary">
                        {recipe.format}
                      </Badge>
                    )}
                  </div>

                  {/* Recipe Info */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-manrope text-xl font-bold">{recipe.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {recipe.kcalPer100g} kcal per 100g • AAFCO {recipe.aafcoLifeStage}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Leaf className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{recipe.sustainabilityScore}% sustainable</span>
                      </div>
                    </div>

                    {/* Macronutrients */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">{recipe.protein}%</div>
                        <div className="text-xs text-muted-foreground">Protein</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">{recipe.fat}%</div>
                        <div className="text-xs text-muted-foreground">Fat</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">{recipe.carbs}%</div>
                        <div className="text-xs text-muted-foreground">Carbs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">{recipe.fiber}%</div>
                        <div className="text-xs text-muted-foreground">Fiber</div>
                      </div>
                    </div>

                    {/* Ingredients */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Ingredients:</div>
                      <div className="flex flex-wrap gap-1">
                        {recipe.ingredients && recipe.ingredients.slice(0, 5).map((ingredient) => (
                          <Badge key={ingredient} variant="outline" className="text-xs">
                            {ingredient}
                          </Badge>
                        ))}
                        {recipe.ingredients && recipe.ingredients.length > 5 && (
                          <Badge variant="outline" className="text-xs font-medium">
                            +{recipe.ingredients.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Sourcing */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Sourced from:</div>
                      <div className="text-xs text-muted-foreground">{recipe.sourcing.join(" • ")}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {availableRecipes.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="space-y-2">
              <h3 className="font-semibold">No recipes available</h3>
              <p className="text-sm text-muted-foreground">
                All our current recipes contain ingredients you've excluded or are coming soon. Please go back and
                adjust your allergen selections.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
