"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Check } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface Recipe {
  id: string
  name: string
  slug: string
  description: string
  allergens: string[]
}

interface RecipeSelectionStepProps {
  selectedRecipes: string[]
  onUpdate: (recipes: string[]) => void
  mealsPerDay: number
  onMealsPerDayUpdate: (meals: number) => void
}

export function RecipeSelectionStep({
  selectedRecipes,
  onUpdate,
  mealsPerDay,
  onMealsPerDayUpdate
}: RecipeSelectionStepProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const { data, error } = await supabase
          .from("recipes")
          .select("id, name, slug, description, allergens")
          .eq("is_active", true)
          .eq("status", "active")
          .order("name")

        if (error) {
          console.error("[customize] Error fetching recipes:", error)
          return
        }

        setRecipes(data || [])
      } catch (err) {
        console.error("[customize] Exception fetching recipes:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchRecipes()
  }, [])

  const toggleRecipe = (recipeSlug: string) => {
    if (selectedRecipes.includes(recipeSlug)) {
      onUpdate(selectedRecipes.filter(r => r !== recipeSlug))
    } else {
      onUpdate([...selectedRecipes, recipeSlug])
    }
  }

  const getRecipeImage = (slug: string) => {
    const imageMap: Record<string, string> = {
      "beef-quinoa-harvest": "/images/recipes/beef-quinoa.png",
      "lamb-pumpkin-feast": "/images/recipes/lamb-pumpkin.png",
      "low-fat-chicken-garden-veggie": "/images/recipes/low-fat-chicken-garden-veggie.png",
      "turkey-brown-rice-comfort": "/images/recipes/turkey-brown-rice.png",
    }
    return imageMap[slug] || "/placeholder.svg?height=200&width=300"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">Choose Your Dog's Meals</h3>
        <p className="text-sm text-muted-foreground">
          Select one or more recipes to add variety to your dog's diet
        </p>
      </div>

      {/* Meals per day selector */}
      <div className="space-y-2">
        <Label>Meals Per Day</Label>
        <div className="flex gap-2">
          {[1, 2, 3].map((num) => (
            <Button
              key={num}
              type="button"
              variant={mealsPerDay === num ? "default" : "outline"}
              onClick={() => onMealsPerDayUpdate(num)}
              className="flex-1"
            >
              {num} {num === 1 ? "Meal" : "Meals"}
            </Button>
          ))}
        </div>
      </div>

      {/* Recipe cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {recipes.map((recipe) => {
          const isSelected = selectedRecipes.includes(recipe.slug)

          return (
            <Card
              key={recipe.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "ring-2 ring-primary shadow-lg"
                  : "hover:shadow-md"
              }`}
              onClick={() => toggleRecipe(recipe.slug)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Recipe Image */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={getRecipeImage(recipe.slug)}
                      alt={recipe.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  {/* Recipe Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1">{recipe.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {recipe.description || "Nutritious and delicious meal for your dog"}
                    </p>
                    {recipe.allergens && recipe.allergens.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {recipe.allergens.slice(0, 2).map((allergen) => (
                          <span
                            key={allergen}
                            className="text-xs px-2 py-0.5 bg-muted rounded-full"
                          >
                            {allergen}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedRecipes.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Select at least one recipe to continue</p>
        </div>
      )}

      {selectedRecipes.length > 0 && (
        <div className="bg-primary/10 rounded-lg p-4 text-center">
          <p className="text-sm font-medium">
            {selectedRecipes.length} recipe{selectedRecipes.length !== 1 ? "s" : ""} selected
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Your dog will enjoy variety with these nutritious meals
          </p>
        </div>
      )}
    </div>
  )
}
