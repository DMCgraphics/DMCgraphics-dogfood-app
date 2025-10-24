"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Minus, Utensils } from "lucide-react"
import { mockRecipes } from "@/lib/nutrition-calculator"

interface MultipleMealSelectorProps {
  selectedRecipes: string[]
  onUpdate: (recipes: string[]) => void
  excludedAllergens: string[]
  maxSelections?: number
}

export function MultipleMealSelector({
  selectedRecipes,
  onUpdate,
  excludedAllergens,
  maxSelections = 3,
}: MultipleMealSelectorProps) {
  const [showAllRecipes, setShowAllRecipes] = useState(false)

  // Debug logging for selected recipes
  useEffect(() => {
    console.log("[v0] MultipleMealSelector - Received selectedRecipes:", selectedRecipes)
    if (selectedRecipes.length > 0) {
      const recipeNames = selectedRecipes
        .map((id) => mockRecipes.find((r) => r.id === id)?.name || `Unknown (${id})`)
        .join(", ")
      console.log("[v0] MultipleMealSelector - Recipe names:", recipeNames)
    } else {
      console.log("[v0] MultipleMealSelector - No recipes selected")
    }
  }, [selectedRecipes])

  const availableRecipes = mockRecipes.filter((recipe) =>
    recipe.allergens.every((allergen) => !excludedAllergens.includes(allergen)),
  )

  const displayedRecipes = showAllRecipes ? availableRecipes : availableRecipes.slice(0, 3)

  const handleRecipeToggle = (recipeId: string) => {
    if (selectedRecipes.includes(recipeId)) {
      onUpdate(selectedRecipes.filter((id) => id !== recipeId))
    } else if (selectedRecipes.length < maxSelections) {
      onUpdate([...selectedRecipes, recipeId])
    }
  }

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Choose Multiple Meals ({selectedRecipes.length}/{maxSelections})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Select up to {maxSelections} different recipes to provide variety in your dog's diet. This helps ensure
              balanced nutrition and keeps mealtime interesting.
            </p>
          </div>

          {selectedRecipes.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Selected Meals:</div>
              <div className="flex flex-wrap gap-2">
                {selectedRecipes.map((recipeId) => {
                  const recipe = mockRecipes.find((r) => r.id === recipeId)
                  return (
                    <Badge key={recipeId} variant="default" className="flex items-center gap-1">
                      {recipe?.name}
                      <button
                        onClick={() => handleRecipeToggle(recipeId)}
                        className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {displayedRecipes.map((recipe) => {
          const isSelected = selectedRecipes.includes(recipe.id)
          const canSelect = selectedRecipes.length < maxSelections || isSelected

          return (
            <Card
              key={recipe.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "ring-2 ring-primary bg-primary/5"
                  : canSelect
                    ? "hover:shadow-md"
                    : "opacity-50 cursor-not-allowed"
              }`}
              onClick={() => canSelect && handleRecipeToggle(recipe.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Checkbox checked={isSelected} disabled={!canSelect} />
                  <img
                    src={getRecipeImage(recipe.id) || "/placeholder.svg"}
                    alt={recipe.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{recipe.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {recipe.protein}% protein • {recipe.kcalPer100g} kcal/100g
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {recipe.allergens.slice(0, 2).map((allergen) => (
                        <Badge key={allergen} variant="outline" className="text-xs">
                          {allergen}
                        </Badge>
                      ))}
                      {recipe.allergens.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{recipe.allergens.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRecipeToggle(recipe.id)
                      }}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                  {!isSelected && canSelect && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRecipeToggle(recipe.id)
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!showAllRecipes && availableRecipes.length > 3 && (
        <Button variant="outline" onClick={() => setShowAllRecipes(true)} className="w-full bg-transparent">
          Show {availableRecipes.length - 3} More Recipes
        </Button>
      )}
    </div>
  )
}
