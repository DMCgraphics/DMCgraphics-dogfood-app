"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calculator, Info } from "lucide-react"
import { useState } from "react"
import { calculateRER, calculateDER, convertToKg, type DogProfile } from "@/lib/nutrition-calculator"

export function RERDERCalculator() {
  const [weight, setWeight] = useState("")
  const [weightUnit, setWeightUnit] = useState<"lb" | "kg">("lb")
  const [age, setAge] = useState("")
  const [ageUnit, setAgeUnit] = useState<"months" | "years">("years")
  const [activity, setActivity] = useState<"low" | "moderate" | "high">("moderate")
  const [bodyCondition, setBodyCondition] = useState(5)
  const [isNeutered, setIsNeutered] = useState<boolean | null>(null)
  const [lifeStage, setLifeStage] = useState<"puppy" | "adult" | "senior">("adult")

  const weightKg = weight ? convertToKg(Number.parseFloat(weight), weightUnit) : 0
  const rer = weightKg > 0 ? calculateRER(weightKg) : 0

  const mockProfile: Partial<DogProfile> = {
    weight: Number.parseFloat(weight) || 0,
    weightUnit,
    age: Number.parseFloat(age) || 0,
    ageUnit,
    activity,
    bodyCondition,
    isNeutered: isNeutered ?? false,
    lifeStage,
  }

  const der = weightKg > 0 && mockProfile.weight ? calculateDER(rer, mockProfile as DogProfile) : 0

  const getActivityFactor = () => {
    let baseFactor = activity === "low" ? 1.2 : activity === "high" ? 1.6 : 1.4

    // Life stage adjustments
    if (lifeStage === "puppy") {
      const ageInMonths = ageUnit === "years" ? (Number.parseFloat(age) || 0) * 12 : Number.parseFloat(age) || 0
      if (ageInMonths < 4) baseFactor = 3.0
      else if (ageInMonths < 12) baseFactor = 2.0
      else baseFactor = 1.8
    }

    // Body condition adjustments
    if (bodyCondition <= 3) baseFactor *= 1.1 // underweight
    if (bodyCondition >= 7) baseFactor *= 0.9 // overweight

    // Neutering adjustment
    if (isNeutered) baseFactor *= 0.95

    return baseFactor
  }

  const activityFactor = getActivityFactor()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          RER & DER Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Form */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Weight</Label>
            <div className="flex gap-2">
              <Input
                id="weight"
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
            <Label htmlFor="age">Age</Label>
            <div className="flex gap-2">
              <Input
                id="age"
                type="number"
                step="0.1"
                placeholder="Enter age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
              <Select value={ageUnit} onValueChange={(value: "months" | "years") => setAgeUnit(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="months">months</SelectItem>
                  <SelectItem value="years">years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Activity Level</Label>
            <Select value={activity} onValueChange={(value: "low" | "moderate" | "high") => setActivity(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (mostly indoor)</SelectItem>
                <SelectItem value="moderate">Moderate (daily walks)</SelectItem>
                <SelectItem value="high">High (very active)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Life Stage</Label>
            <Select value={lifeStage} onValueChange={(value: "puppy" | "adult" | "senior") => setLifeStage(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="puppy">Puppy (under 12 months)</SelectItem>
                <SelectItem value="adult">Adult (1-7 years)</SelectItem>
                <SelectItem value="senior">Senior (7+ years)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Body Condition (1-9)</Label>
            <Input
              type="number"
              min="1"
              max="9"
              value={bodyCondition}
              onChange={(e) => setBodyCondition(Number.parseInt(e.target.value) || 5)}
            />
          </div>

          <div className="space-y-2">
            <Label>Spayed/Neutered</Label>
            <div className="flex gap-2">
              <Button
                variant={isNeutered === true ? "default" : "outline"}
                onClick={() => setIsNeutered(true)}
                size="sm"
                className="flex-1"
              >
                Yes
              </Button>
              <Button
                variant={isNeutered === false ? "default" : "outline"}
                onClick={() => setIsNeutered(false)}
                size="sm"
                className="flex-1"
              >
                No
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        {weightKg > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">{Math.round(rer)}</div>
                <div className="text-sm text-muted-foreground">RER (kcal/day)</div>
                <Badge variant="outline">Resting Energy</Badge>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">{activityFactor.toFixed(2)}x</div>
                <div className="text-sm text-muted-foreground">Activity Factor</div>
                <Badge variant="outline">Multiplier</Badge>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">{Math.round(der)}</div>
                <div className="text-sm text-muted-foreground">DER (kcal/day)</div>
                <Badge variant="outline">Daily Energy Need</Badge>
              </div>
            </div>

            {/* Calculation Breakdown */}
            <div className="p-4 bg-muted/30 rounded-lg space-y-2 text-sm">
              <div className="font-semibold flex items-center gap-2">
                <Info className="h-4 w-4" />
                Calculation Breakdown:
              </div>
              <div>
                1. RER = 70 × ({weightKg.toFixed(1)} kg)^0.75 = {Math.round(rer)} kcal/day
              </div>
              <div>
                2. Activity Factor = {activity} ({activity === "low" ? "1.2" : activity === "high" ? "1.6" : "1.4"})
                {lifeStage === "puppy" && " × puppy multiplier"}
                {bodyCondition <= 3 && " × 1.1 (underweight)"}
                {bodyCondition >= 7 && " × 0.9 (overweight)"}
                {isNeutered && " × 0.95 (neutered)"}
              </div>
              <div>
                3. DER = RER × Activity Factor = {Math.round(rer)} × {activityFactor.toFixed(2)} = {Math.round(der)}{" "}
                kcal/day
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
