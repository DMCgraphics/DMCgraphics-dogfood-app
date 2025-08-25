"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Utensils, Clock } from "lucide-react"
import { useState } from "react"
import { mockRecipes, calculateDailyGrams } from "@/lib/nutrition-calculator"

export function PortionCalculator() {
  const [der, setDer] = useState("")
  const [selectedRecipeId, setSelectedRecipeId] = useState("")
  const [mealsPerDay, setMealsPerDay] = useState(2)

  const selectedRecipe = mockRecipes.find((r) => r.id === selectedRecipeId)
  const derValue = Number.parseFloat(der) || 0
  const dailyGrams = selectedRecipe && derValue > 0 ? calculateDailyGrams(derValue, selectedRecipe.kcalPer100g) : 0
  const gramsPerMeal = dailyGrams / mealsPerDay

  // Estimate cost (mock pricing)
  const costPer100g = 3.5 // $3.50 per 100g
  const dailyCost = (dailyGrams / 100) * costPer100g
  const monthlyCost = dailyCost * 30

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Utensils className="h-5 w-5" />
          Portion Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Form */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="der">Daily Energy Requirement (DER)</Label>
            <Input
              id="der"
              type="number"
              placeholder="Enter DER in kcal/day"
              value={der}
              onChange={(e) => setDer(e.target.value)}
            />
            <div className="text-xs text-muted-foreground">Use the RER & DER calculator above to find this value</div>
          </div>

          <div className="space-y-2">
            <Label>Recipe</Label>
            <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a recipe" />
              </SelectTrigger>
              <SelectContent>
                {mockRecipes.map((recipe) => (
                  <SelectItem key={recipe.id} value={recipe.id}>
                    {recipe.name} ({recipe.kcalPer100g} kcal/100g)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Meals per Day</Label>
            <div className="flex gap-2">
              {[1, 2, 3].map((meals) => (
                <button
                  key={meals}
                  onClick={() => setMealsPerDay(meals)}
                  className={`flex-1 p-2 text-sm border rounded-md transition-colors ${
                    mealsPerDay === meals
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  {meals} meal{meals > 1 ? "s" : ""}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {dailyGrams > 0 && selectedRecipe && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">{Math.round(dailyGrams)}g</div>
                <div className="text-sm text-muted-foreground">Total Daily Food</div>
                <Badge variant="outline">{selectedRecipe.name}</Badge>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">{Math.round(gramsPerMeal)}g</div>
                <div className="text-sm text-muted-foreground">Per Meal</div>
                <Badge variant="outline">{mealsPerDay} meals/day</Badge>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">${monthlyCost.toFixed(0)}</div>
                <div className="text-sm text-muted-foreground">Monthly Cost</div>
                <Badge variant="outline">${dailyCost.toFixed(2)}/day</Badge>
              </div>
            </div>

            {/* Feeding Schedule */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-medium">
                <Clock className="h-4 w-4" />
                Suggested Feeding Schedule:
              </div>
              <div className="grid gap-2">
                {Array.from({ length: mealsPerDay }, (_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">Meal {i + 1}</Badge>
                      <span className="text-sm">
                        {i === 0 && "Morning (7-8 AM)"}
                        {i === 1 && mealsPerDay === 2 && "Evening (5-6 PM)"}
                        {i === 1 && mealsPerDay === 3 && "Afternoon (12-1 PM)"}
                        {i === 2 && "Evening (5-6 PM)"}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{Math.round(gramsPerMeal)}g</div>
                      <div className="text-xs text-muted-foreground">~{(gramsPerMeal / 400).toFixed(1)} packs</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculation Formula */}
            <div className="p-4 bg-muted/30 rounded-lg space-y-2 text-sm">
              <div className="font-semibold">Calculation Formula:</div>
              <div>Daily grams = (DER ÷ Recipe kcal per 100g) × 100</div>
              <div>
                {Math.round(dailyGrams)}g = ({derValue} ÷ {selectedRecipe.kcalPer100g}) × 100
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
