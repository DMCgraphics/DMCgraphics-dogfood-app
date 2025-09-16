"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Heart, Droplets } from "lucide-react"
import { useState } from "react"
import { calculateEPADHATarget, convertToKg, mockAddOns } from "@/lib/nutrition-calculator"

export function EPADHACalculator() {
  const [weight, setWeight] = useState("")
  const [weightUnit, setWeightUnit] = useState<"lb" | "kg">("lb")
  const [selectedFishOil, setSelectedFishOil] = useState("")

  const weightKg = weight ? convertToKg(Number.parseFloat(weight), weightUnit) : 0
  const epaTarget = weightKg > 0 ? calculateEPADHATarget(weightKg) : 0

  const fishOil = mockAddOns.find((addon) => addon.id === selectedFishOil && addon.type === "fish-oil")
  const mlNeeded = fishOil && epaTarget > 0 ? epaTarget / (fishOil.epaPerMl || 1) : 0
  const totalEPA = fishOil && mlNeeded > 0 ? mlNeeded * (fishOil.epaPerMl || 0) : 0
  const totalDHA = fishOil && mlNeeded > 0 ? mlNeeded * (fishOil.dhaPerMl || 0) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          EPA+DHA Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Form */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weight-epa">Dog's Weight</Label>
            <div className="flex gap-2">
              <Input
                id="weight-epa"
                type="number"
                step="0.1"
                placeholder="Enter weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
              <Select value={weightUnit} onValueChange={(value: "lb" | "kg") => setWeightUnit(value)}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lb">lb</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fish Oil Supplement</Label>
            <Select value={selectedFishOil} onValueChange={setSelectedFishOil}>
              <SelectTrigger>
                <SelectValue placeholder="Select fish oil" />
              </SelectTrigger>
              <SelectContent>
                {mockAddOns
                  .filter((addon) => addon.type === "fish-oil")
                  .map((addon) => (
                    <SelectItem key={addon.id} value={addon.id}>
                      {addon.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Target Calculation */}
        {weightKg > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">{Math.round(epaTarget)} mg</div>
              <div className="text-sm text-muted-foreground">Recommended EPA+DHA per day</div>
              <Badge variant="outline">
                Based on {weight} {weightUnit} body weight
              </Badge>
            </div>

            {/* Fish Oil Dosage */}
            {fishOil && mlNeeded > 0 && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <div className="space-y-2">
                    <div className="text-lg font-bold text-primary">{mlNeeded.toFixed(1)} ml</div>
                    <div className="text-sm text-muted-foreground">Daily Dosage</div>
                    <Badge variant="outline">{fishOil.name}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="text-lg font-bold text-primary">{Math.round(totalEPA)} mg</div>
                    <div className="text-sm text-muted-foreground">EPA per day</div>
                    <Badge variant="outline">Omega-3</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="text-lg font-bold text-primary">{Math.round(totalDHA)} mg</div>
                    <div className="text-sm text-muted-foreground">DHA per day</div>
                    <Badge variant="outline">Omega-3</Badge>
                  </div>
                </div>

                {/* Benefits */}
                <div className="p-4 bg-primary/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="h-4 w-4 text-primary" />
                    <span className="font-medium">Health Benefits</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>• Supports healthy skin and shiny coat</div>
                    <div>• Promotes joint health and mobility</div>
                    <div>• Supports cognitive function and brain health</div>
                    <div>• Helps maintain healthy inflammatory response</div>
                  </div>
                </div>
              </div>
            )}

            {/* Calculation Method */}
            <div className="p-4 bg-muted/30 rounded-lg space-y-2 text-sm">
              <div className="font-semibold">Calculation Method:</div>
              <div>EPA+DHA Target = ~90 mg per 10 lb body weight (veterinary guideline)</div>
              <div>
                For {weight} {weightUnit} dog: ({weight} {weightUnit === "lb" ? "÷ 10" : "× 2.2 ÷ 10"}) × 90 mg ={" "}
                {Math.round(epaTarget)} mg
              </div>
              {fishOil && (
                <div>
                  Dosage: {Math.round(epaTarget)} mg ÷ {fishOil.epaPerMl} mg/ml = {mlNeeded.toFixed(1)} ml daily
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
