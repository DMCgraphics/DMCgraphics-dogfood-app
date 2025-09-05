"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calculator, Info } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { aafcoStandards, getAAFCOCompliance, getComplianceColor, getComplianceBarColor } from "@/lib/aafco-standards"
import type { Recipe } from "@/lib/nutrition-calculator"

interface NutrientTransparencyPanelProps {
  recipe: Recipe
  dailyAmount?: number // grams per day for per-day calculations
}

export function NutrientTransparencyPanel({ recipe, dailyAmount = 100 }: NutrientTransparencyPanelProps) {
  const [showMath, setShowMath] = useState(false)

  // Calculate per-day values based on daily amount
  const calculatePerDay = (per100gValue: number) => {
    return (per100gValue * dailyAmount) / 100
  }

  // Calculate Ca:P ratio
  const caPRatio = recipe.calcium / recipe.phosphorus

  const nutrients = [
    { name: "Protein", per100g: recipe.protein, unit: "%" },
    { name: "Fat", per100g: recipe.fat, unit: "%" },
    { name: "Fiber", per100g: recipe.fiber, unit: "%" },
    { name: "Moisture", per100g: recipe.moisture, unit: "%" },
    { name: "Calcium", per100g: recipe.calcium, unit: "mg" },
    { name: "Phosphorus", per100g: recipe.phosphorus, unit: "mg" },
    { name: "EPA+DHA", per100g: recipe.epa + recipe.dha, unit: "mg" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Nutrient Transparency Panel</span>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="bg-transparent">
                <Calculator className="h-4 w-4 mr-2" />
                Show the Math
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nutritional Calculations</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">How we calculate daily values:</h4>
                  <p className="text-sm text-muted-foreground">
                    Daily nutrient values are calculated based on your dog's specific daily food amount ({dailyAmount}g
                    per day in this example).
                  </p>
                </div>
                <div className="space-y-3">
                  {nutrients.map((nutrient) => (
                    <div key={nutrient.name} className="text-sm">
                      <div className="font-medium">{nutrient.name}:</div>
                      <div className="text-muted-foreground ml-4">
                        {nutrient.per100g} {nutrient.unit}/100g × ({dailyAmount}g ÷ 100g) ={" "}
                        {calculatePerDay(nutrient.per100g).toFixed(1)} {nutrient.unit}/day
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t">
                  <div className="font-semibold mb-2">Ca:P Ratio Calculation:</div>
                  <div className="text-sm text-muted-foreground">
                    Calcium ({recipe.calcium}mg) ÷ Phosphorus ({recipe.phosphorus}mg) = {caPRatio.toFixed(2)}:1
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Ideal range: 1.2:1 to 2:1 (AAFCO guidelines)</div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Per 100g vs Per Day Toggle */}
        <div className="flex items-center justify-center">
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={!showMath ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowMath(false)}
              className="text-xs"
            >
              Per 100g
            </Button>
            <Button
              variant={showMath ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowMath(true)}
              className="text-xs"
            >
              Per Day ({dailyAmount}g)
            </Button>
          </div>
        </div>

        {/* Nutrient Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {nutrients.map((nutrient) => {
            const compliance = getAAFCOCompliance(nutrient.name, nutrient.per100g, recipe.aafcoLifeStage)
            const displayValue = showMath ? calculatePerDay(nutrient.per100g) : nutrient.per100g

            return (
              <div key={nutrient.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{nutrient.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">
                      {displayValue.toFixed(1)} {nutrient.unit}
                      {showMath && "/day"}
                    </span>
                    <Badge variant="outline" className={`text-xs ${getComplianceColor(compliance)} border-current`}>
                      {compliance}
                    </Badge>
                  </div>
                </div>

                {/* AAFCO Compliance Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>AAFCO Min</span>
                    <span>Current</span>
                    <span>AAFCO Max</span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full ${getComplianceBarColor(compliance)} transition-all`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            10,
                            (nutrient.per100g /
                              (aafcoStandards.find((s) => s.nutrient === nutrient.name)?.adultMin || 100)) *
                              50,
                          ),
                        )}%`,
                      }}
                    />
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
              <span className="font-bold">{caPRatio.toFixed(2)}:1</span>
              <Badge
                variant="outline"
                className={`text-xs ${caPRatio >= 1.2 && caPRatio <= 2 ? "text-primary border-primary" : "text-orange-500 border-orange-500"}`}
              >
                {caPRatio >= 1.2 && caPRatio <= 2 ? "OPTIMAL" : "REVIEW"}
              </Badge>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            AAFCO recommends 1.2:1 to 2:1 ratio for optimal bone health
          </div>
        </div>

        {/* EPA+DHA Highlight */}
        <div className="p-4 bg-primary/5 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-primary" />
            <span className="font-medium">Omega-3 Fatty Acids</span>
          </div>
          <div className="text-sm text-muted-foreground">
            This recipe provides {recipe.epa + recipe.dha}mg of EPA+DHA per 100g, supporting skin, coat, and joint
            health. Daily intake: {calculatePerDay(recipe.epa + recipe.dha).toFixed(0)}mg based on {dailyAmount}g
            serving.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
