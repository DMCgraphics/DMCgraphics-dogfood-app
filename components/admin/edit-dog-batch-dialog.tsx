"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"

interface EditDogBatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dogData: {
    dogId: string
    dogName: string
    dogWeightKg: number
    dogWeightLbs: number
    activityLevel: string
    recipes: {
      recipeName: string
      biweeklyGrams: number
      biweeklyPacks: number
    }[]
  }
  onSuccess: () => void
}

interface Recipe {
  id: string
  name: string
  slug: string
}

interface PlanData {
  id: string
  plan_type: 'full' | 'topper'
  topper_level: string | null
  recipe_ids: string[]
}

export function EditDogBatchDialog({
  open,
  onOpenChange,
  dogData,
  onSuccess,
}: EditDogBatchDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [availableRecipes, setAvailableRecipes] = useState<Recipe[]>([])
  const [planData, setPlanData] = useState<PlanData | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    weight_lbs: 0,
    activity_level: "moderate",
    plan_type: "full" as 'full' | 'topper',
    topper_level: null as string | null,
    recipe_ids: [] as string[],
  })

  // Load available recipes and current plan data when dialog opens
  useEffect(() => {
    if (open) {
      loadRecipesAndPlanData()
    }
  }, [open, dogData.dogId])

  async function loadRecipesAndPlanData() {
    setLoading(true)
    try {
      // Fetch available recipes
      const recipesResponse = await fetch("/api/recipes")
      if (recipesResponse.ok) {
        const recipes = await recipesResponse.json()
        setAvailableRecipes(recipes)
      }

      // Fetch plan data for this dog
      const planResponse = await fetch(`/api/admin/dogs/${dogData.dogId}/plan`)
      if (planResponse.ok) {
        const plan = await planResponse.json()
        setPlanData(plan)

        // Populate form with current data
        setFormData({
          name: dogData.dogName,
          weight_lbs: dogData.dogWeightLbs,
          activity_level: dogData.activityLevel,
          plan_type: plan.plan_type || 'full',
          topper_level: plan.topper_level,
          recipe_ids: plan.recipe_ids || [],
        })
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Update dog info if changed
      const dogChanged =
        formData.name !== dogData.dogName ||
        formData.weight_lbs !== dogData.dogWeightLbs ||
        formData.activity_level !== dogData.activityLevel

      if (dogChanged) {
        const dogResponse = await fetch(`/api/admin/dogs/${dogData.dogId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            weight_kg: formData.weight_lbs * 0.453592,
            activity_level: formData.activity_level,
          }),
        })

        if (!dogResponse.ok) {
          const error = await dogResponse.json()
          throw new Error(error.error || "Failed to update dog info")
        }
      }

      // Update plan type if changed
      if (planData) {
        const planChanged =
          formData.plan_type !== planData.plan_type ||
          formData.topper_level !== planData.topper_level

        if (planChanged) {
          const planResponse = await fetch(`/api/admin/plans/${planData.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              plan_type: formData.plan_type,
              topper_level: formData.topper_level,
            }),
          })

          if (!planResponse.ok) {
            const error = await planResponse.json()
            throw new Error(error.error || "Failed to update plan type")
          }
        }

        // Update recipes if changed
        const currentRecipeIds = planData.recipe_ids.sort().join(',')
        const newRecipeIds = formData.recipe_ids.sort().join(',')

        if (currentRecipeIds !== newRecipeIds) {
          const recipesResponse = await fetch(`/api/admin/plans/${planData.id}/recipes`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipeIds: formData.recipe_ids,
            }),
          })

          if (!recipesResponse.ok) {
            const error = await recipesResponse.json()
            throw new Error(error.error || "Failed to update recipes")
          }
        }
      }

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error updating dog/plan:", error)
      alert(error.message || "Failed to update dog/plan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleRecipe = (recipeId: string) => {
    setFormData(prev => ({
      ...prev,
      recipe_ids: prev.recipe_ids.includes(recipeId)
        ? prev.recipe_ids.filter(id => id !== recipeId)
        : [...prev.recipe_ids, recipeId]
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Dog & Meal Plan</DialogTitle>
          <DialogDescription>
            Update dog information and meal plan settings
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 py-4">
              {/* Dog Info Section */}
              <div>
                <h3 className="font-semibold mb-3">Dog Information</h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Dog Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Buddy"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="weight">Weight (lbs)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={formData.weight_lbs}
                      onChange={(e) =>
                        setFormData({ ...formData, weight_lbs: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="50"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="activity">Activity Level</Label>
                    <Select
                      value={formData.activity_level}
                      onValueChange={(value) =>
                        setFormData({ ...formData, activity_level: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Meal Plan Section */}
              <div>
                <h3 className="font-semibold mb-3">Meal Plan</h3>
                <div className="grid gap-4">
                  <div className="grid gap-3">
                    <Label>Plan Type</Label>
                    <RadioGroup
                      value={formData.plan_type}
                      onValueChange={(value: 'full' | 'topper') => {
                        setFormData({
                          ...formData,
                          plan_type: value,
                          topper_level: value === 'full' ? null : formData.topper_level || '50'
                        })
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="full" id="full" />
                        <Label htmlFor="full" className="font-normal cursor-pointer">
                          Full Meal (100% of daily calories)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="topper" id="topper" />
                        <Label htmlFor="topper" className="font-normal cursor-pointer">
                          Topper (supplement to kibble)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {formData.plan_type === 'topper' && (
                    <div className="grid gap-2 ml-6">
                      <Label htmlFor="topper_percentage">Topper Percentage</Label>
                      <Select
                        value={formData.topper_level || '50'}
                        onValueChange={(value) =>
                          setFormData({ ...formData, topper_level: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25% of daily calories</SelectItem>
                          <SelectItem value="50">50% of daily calories</SelectItem>
                          <SelectItem value="75">75% of daily calories</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid gap-3">
                    <Label>Recipes (select at least one)</Label>
                    <div className="border rounded-lg p-3 max-h-[200px] overflow-y-auto">
                      {availableRecipes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Loading recipes...</p>
                      ) : (
                        <div className="space-y-2">
                          {availableRecipes.map((recipe) => (
                            <div key={recipe.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`recipe-${recipe.id}`}
                                checked={formData.recipe_ids.includes(recipe.id)}
                                onCheckedChange={() => toggleRecipe(recipe.id)}
                              />
                              <Label
                                htmlFor={`recipe-${recipe.id}`}
                                className="font-normal cursor-pointer"
                              >
                                {recipe.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || formData.recipe_ids.length === 0}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
