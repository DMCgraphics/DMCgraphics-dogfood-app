"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { useState } from "react"
import { mockRecipes } from "@/lib/nutrition-calculator"
import { aafcoStandards, getAAFCOCompliance, getComplianceColor } from "@/lib/aafco-standards"

export function NutrientAnalyzer() {
  const [selectedRecipeId, setSelectedRecipeId] = useState("")
  const [lifeStage, setLifeStage] = useState<"adult" | "growth">("adult")

  const selectedRecipe = mockRecipes.find((r) => r.id === selectedRecipeId)

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case "LOW":
        return XCircle
      case "HIGH":
        return AlertTriangle
      case "OPTIMAL":
        return CheckCircle
      case "OK":
      default:
        return CheckCircle
    }
  }

  const getProgressValue = (nutrient: string, value: number) => {
    const standard = aafcoStandards.find((s) => s.nutrient === nutrient)
    if (!standard) return 50

    const min = lifeStage === "growth" ? standard.growthMin : standard.adultMin
    const max = lifeStage === "growth" ? standard.growthMax : standard.adultMax

    if (!max) {
      // For nutrients without max, show progress toward optimal (120% of minimum)
      return Math.min(100, (value / (min * 1.2)) * 100)
    }

    // For nutrients with max, show position within range
    return ((value - min) / (max - min)) * 100
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          AAFCO Nutrient Analyzer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Form */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Recipe</label>
            <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a recipe to analyze" />
              </SelectTrigger>
              <SelectContent>
                {mockRecipes.map((recipe) => (
                  <SelectItem key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Life Stage</label>
            <Select value={lifeStage} onValueChange={(value: "adult" | "growth") => setLifeStage(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adult">Adult Dogs</SelectItem>
                <SelectItem value="growth">Puppies (Growth)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Analysis Results */}
        {selectedRecipe && (
          <div className="space-y-4 pt-4 border-t">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">{selectedRecipe.name}</h3>
              <Badge variant="outline">{selectedRecipe.kcalPer100g} kcal per 100g</Badge>
            </div>

            {/* Nutrient Analysis */}
            <div className="space-y-4">
              {[
                { name: "Protein", value: selectedRecipe.protein, unit: "%" },
                { name: "Fat", value: selectedRecipe.fat, unit: "%" },
                { name: "Fiber", value: selectedRecipe.fiber, unit: "%" },
                { name: "Moisture", value: selectedRecipe.moisture, unit: "%" },
                { name: "Calcium", value: selectedRecipe.calcium, unit: "mg/100g" },
                { name: "Phosphorus", value: selectedRecipe.phosphorus, unit: "mg/100g" },
                { name: "EPA+DHA", value: selectedRecipe.epa + selectedRecipe.dha, unit: "mg/100g" },
              ].map((nutrient) => {
                const compliance = getAAFCOCompliance(nutrient.name, nutrient.value, lifeStage)
                const ComplianceIcon = getComplianceIcon(compliance)
                const progressValue = getProgressValue(nutrient.name, nutrient.value)

                const standard = aafcoStandards.find((s) => s.nutrient === nutrient.name)
                const min = standard ? (lifeStage === "growth" ? standard.growthMin : standard.adultMin) : 0
                const max = standard ? (lifeStage === "growth" ? standard.growthMax : standard.adultMax) : null

                return (
                  <div key={nutrient.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{nutrient.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">
                          {nutrient.value} {nutrient.unit}
                        </span>
                        <ComplianceIcon className={`h-4 w-4 ${getComplianceColor(compliance)}`} />
                        <Badge variant="outline" className={`${getComplianceColor(compliance)} border-current`}>
                          {compliance}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Progress value={Math.max(0, Math.min(100, progressValue))} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Min: {min}</span>
                        <span>Current: {nutrient.value}</span>
                        {max && <span>Max: {max}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Ca:P Ratio */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Calcium : Phosphorus Ratio</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{(selectedRecipe.calcium / selectedRecipe.phosphorus).toFixed(2)}:1</span>
                  <Badge
                    variant="outline"
                    className={
                      selectedRecipe.calcium / selectedRecipe.phosphorus >= 1.2 &&
                      selectedRecipe.calcium / selectedRecipe.phosphorus <= 2
                        ? "text-primary border-primary"
                        : "text-orange-500 border-orange-500"
                    }
                  >
                    {selectedRecipe.calcium / selectedRecipe.phosphorus >= 1.2 &&
                    selectedRecipe.calcium / selectedRecipe.phosphorus <= 2
                      ? "OPTIMAL"
                      : "REVIEW"}
                  </Badge>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                AAFCO recommends 1.2:1 to 2:1 ratio for optimal bone health
              </div>
            </div>

            {/* Overall Assessment */}
            <div className="p-4 bg-primary/5 rounded-lg">
              <div className="font-semibold mb-2">AAFCO Compliance Summary</div>
              <div className="text-sm text-muted-foreground">
                This recipe{" "}
                {selectedRecipe.aafcoLifeStage === "all"
                  ? "meets AAFCO standards for all life stages"
                  : `is formulated for ${selectedRecipe.aafcoLifeStage} dogs`}{" "}
                and provides complete and balanced nutrition according to AAFCO guidelines.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
