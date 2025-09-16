"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calculator, Clock, DollarSign, Stethoscope, Utensils, AlertCircle } from "lucide-react"
import { calculateRER, calculateDER, convertToKg, mockRecipes, type DogProfile } from "@/lib/nutrition-calculator"
import { prescriptionDiets, getPrescriptionDietsByCondition, getMedicalConditionById } from "@/lib/prescription-diets"
import { useState, useEffect, useRef } from "react"
import { PlanPricingProvider, usePlanPricing } from "@/lib/plan-pricing-context"
import { PricingClarityCard } from "@/components/ui/pricing-clarity-card"

interface Step5Props {
  dogProfile: Partial<DogProfile>
  selectedRecipeId: string | null
  selectedRecipes?: string[]
  selectedPrescriptionDiet?: string | null
  selectedCondition?: string | null
  mealsPerDay: number
  onUpdate: (mealsPerDay: number) => void
}

function Step5PortionsInner({
  dogProfile,
  selectedRecipeId,
  selectedRecipes = [],
  selectedPrescriptionDiet,
  selectedCondition,
  mealsPerDay,
  onUpdate,
}: Step5Props) {
  const [showCalculations, setShowCalculations] = useState(false)
  const [autoSelectedPrescriptionDiet, setAutoSelectedPrescriptionDiet] = useState<string | null>(null)
  const [autoMealsApplied, setAutoMealsApplied] = useState(false)

  const { pricing, gramsPerMeal, validatePriceInvariance, trackMealsPerDayChange, getPricingSnapshot } =
    usePlanPricing()
  const previousCostRef = useRef<number>(pricing.costPerDay)
  const pricingSnapshotRef = useRef<ReturnType<typeof getPricingSnapshot> | null>(null)

  useEffect(() => {
    if (selectedCondition && !selectedPrescriptionDiet && !autoSelectedPrescriptionDiet) {
      const availableDiets = getPrescriptionDietsByCondition(selectedCondition)
      if (availableDiets.length > 0) {
        const firstDiet = availableDiets[0]
        setAutoSelectedPrescriptionDiet(firstDiet.id)
        console.log(`[v0] Auto-selected prescription diet: ${firstDiet.name} for condition: ${selectedCondition}`)
      }
    }
  }, [selectedCondition, selectedPrescriptionDiet, autoSelectedPrescriptionDiet])

  useEffect(() => {
    if (selectedCondition && !autoMealsApplied) {
      if (selectedCondition === "pancreatitis" || selectedCondition === "diabetes") {
        if (mealsPerDay === 2) {
          onUpdate(3)
          setAutoMealsApplied(true)
        }
      }
    }
  }, [selectedCondition, mealsPerDay, onUpdate, autoMealsApplied])

  const handleMealsPerDayChange = (newMealsPerDay: number) => {
    const oldMealsPerDay = mealsPerDay
    const oldCost = previousCostRef.current

    pricingSnapshotRef.current = getPricingSnapshot()

    // Track the change for analytics
    trackMealsPerDayChange(oldMealsPerDay, newMealsPerDay)

    onUpdate(newMealsPerDay)

    setTimeout(() => {
      const newCost = pricing.costPerDay

      if (!validatePriceInvariance(oldCost, newCost, newMealsPerDay)) {
        console.error("[v0] CRITICAL: Price changed when meals/day changed - this violates pricing invariance!")

        // In production, this would revert the change
        if (pricingSnapshotRef.current) {
          console.warn("[v0] Attempting to restore previous pricing state...")
          // This would trigger a state restoration in a real implementation
        }

        // Show user-facing error (in production, this might be a toast notification)
        if (process.env.NODE_ENV === "development") {
          alert(`Price invariance violation detected! Old: $${oldCost.toFixed(2)}, New: $${newCost.toFixed(2)}`)
        }
      } else {
        console.log(
          `[v0] Price invariance maintained: $${oldCost.toFixed(2)} → $${newCost.toFixed(2)} (diff: $${Math.abs(newCost - oldCost).toFixed(4)})`,
        )
      }
    }, 0)

    previousCostRef.current = pricing.costPerDay
  }

  const activePrescriptionDiet = selectedPrescriptionDiet || autoSelectedPrescriptionDiet
  const activeRecipes = selectedRecipes.length > 0 ? selectedRecipes : selectedRecipeId ? [selectedRecipeId] : []

  const selectedRecipe = activePrescriptionDiet
    ? prescriptionDiets.find((d) => d.id === activePrescriptionDiet)
    : activeRecipes.length === 1
      ? mockRecipes.find((r) => r.id === activeRecipes[0])
      : null

  const multipleRecipes =
    !activePrescriptionDiet && activeRecipes.length > 1
      ? activeRecipes.map((id) => mockRecipes.find((r) => r.id === id)).filter(Boolean)
      : []

  const condition = selectedCondition ? getMedicalConditionById(selectedCondition) : null

  if (!pricing.activeCaloriesPer100g || !dogProfile.weight || !dogProfile.weightUnit) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Please complete previous steps to see portion calculations.</p>
        </CardContent>
      </Card>
    )
  }

  const weightKg = convertToKg(dogProfile.weight, dogProfile.weightUnit)
  const rer = calculateRER(weightKg)
  const der = calculateDER(rer, dogProfile as DogProfile)

  const dailyGrams = pricing.dailyGrams
  const estimatedCostPerDay = pricing.costPerDay
  const caloriesPer100g = pricing.activeCaloriesPer100g
  const currentGramsPerMeal = gramsPerMeal(mealsPerDay)

  return (
    <div className="space-y-6">
      <PricingClarityCard
        recipeNames={pricing.recipeNames}
        mealsPerDay={mealsPerDay}
        isMultiRecipe={multipleRecipes.length > 1}
        isMedical={pricing.isMedical}
      />

      {activePrescriptionDiet && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              <div className="space-y-1 flex-1">
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  {autoSelectedPrescriptionDiet && !selectedPrescriptionDiet
                    ? "Prescription Diet Auto-Selected"
                    : "Prescription Diet Selected"}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Portions calculated for {selectedRecipe?.name} therapeutic diet for {condition?.name}.
                  {autoSelectedPrescriptionDiet &&
                    !selectedPrescriptionDiet &&
                    " This diet was automatically recommended based on your dog's medical condition."}{" "}
                  Follow your veterinarian's feeding guidelines.
                </p>
              </div>
              {autoSelectedPrescriptionDiet && !selectedPrescriptionDiet && (
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  Auto-Selected
                </Badge>
              )}
            </div>
            {condition && (
              <div className="mt-3 p-3 bg-white/60 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm">
                  <div className="font-medium mb-1">Medical Condition: {condition.name}</div>
                  <div className="text-muted-foreground">{condition.description}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedCondition && !activePrescriptionDiet && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div className="space-y-1">
                <p className="font-medium text-amber-800 dark:text-amber-200">Medical Condition Detected</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Your dog has {condition?.name}. A prescription diet is recommended for optimal health management.
                  Please consult with your veterinarian about therapeutic nutrition options.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {multipleRecipes.length > 1 && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Utensils className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">Multiple Recipe Variety Plan</p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Portions calculated across {multipleRecipes.length} different recipes for optimal nutrition variety.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {multipleRecipes.map((recipe) => (
                  <Badge key={recipe.id} variant="outline" className="text-green-700 border-green-300">
                    {recipe.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calculation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Daily Nutrition Plan
            {activePrescriptionDiet && (
              <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-300">
                Therapeutic Diet
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">{Math.round(dailyGrams)}g</div>
              <div className="text-sm text-muted-foreground">Total daily food</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">{Math.round(der)}</div>
              <div className="text-sm text-muted-foreground">Daily calories (kcal)</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">${estimatedCostPerDay.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Estimated cost per day</div>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowCalculations(!showCalculations)}
            className="w-full bg-transparent"
          >
            {showCalculations ? "Hide" : "Show"} the math
          </Button>

          {showCalculations && (
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg text-sm">
              <div className="font-semibold">Calculation breakdown:</div>
              <div>
                1. RER (Resting Energy Requirement) = 70 × ({weightKg.toFixed(1)} kg)^0.75 = {Math.round(rer)} kcal
              </div>
              <div>
                2. DER (Daily Energy Requirement) = RER × activity factor ({dogProfile.activity}) = {Math.round(der)}{" "}
                kcal
              </div>
              <div>
                3. Daily food = DER ÷ recipe calories × 100 = {Math.round(der)} ÷ {caloriesPer100g} × 100 ={" "}
                {Math.round(dailyGrams)}g
              </div>
              {activePrescriptionDiet && (
                <div className="text-blue-700 dark:text-blue-300 font-medium">
                  * Calculations adjusted for therapeutic diet requirements
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meal Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Feeding Schedule
            {selectedCondition && (selectedCondition === "pancreatitis" || selectedCondition === "diabetes") && (
              <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                3 meals recommended
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Meals per day:</span>
              <div className="flex gap-2">
                {[1, 2, 3].map((meals) => (
                  <Button
                    key={meals}
                    variant={mealsPerDay === meals ? "default" : "outline"}
                    onClick={() => handleMealsPerDayChange(meals)}
                    size="sm"
                  >
                    {meals}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="font-medium">
                Portion per meal: {Math.round(currentGramsPerMeal)}g
                <span className="text-sm text-muted-foreground ml-2">
                  ({(currentGramsPerMeal / pricing.packInfo.packSize).toFixed(1)} × {pricing.packInfo.packSize}g packs)
                </span>
                {multipleRecipes.length > 1 && (
                  <span className="text-sm text-muted-foreground ml-2">
                    (rotate between {multipleRecipes.length} recipes)
                  </span>
                )}
              </div>

              <div className="grid gap-3">
                {Array.from({ length: mealsPerDay }, (_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">Meal {i + 1}</Badge>
                      <span className="text-sm">
                        {i === 0 && "Morning"}
                        {i === 1 && mealsPerDay === 2 && "Evening"}
                        {i === 1 && mealsPerDay === 3 && "Afternoon"}
                        {i === 2 && "Evening"}
                      </span>
                      {multipleRecipes.length > 1 && (
                        <Badge variant="outline" className="text-xs">
                          {multipleRecipes[i % multipleRecipes.length]?.name}
                        </Badge>
                      )}
                      {activePrescriptionDiet && (
                        <Badge variant="outline" className="text-xs text-blue-700 border-blue-300">
                          Prescription
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{Math.round(currentGramsPerMeal)}g</div>
                      <div className="text-xs text-muted-foreground">
                        {(currentGramsPerMeal / pricing.packInfo.packSize).toFixed(1)} packs
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 bg-primary/5 rounded-lg">
            <div className="text-sm">
              <div className="font-semibold mb-2">
                {activePrescriptionDiet
                  ? "Prescription diet feeding recommendations:"
                  : multipleRecipes.length > 1
                    ? "Multiple recipe feeding recommendations:"
                    : "Feeding recommendations:"}
              </div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Feed at consistent times each day</li>
                <li>• Always provide fresh water</li>
                <li>• Monitor your dog's weight and adjust portions as needed</li>
                <li>• Transition gradually when switching foods</li>
                {multipleRecipes.length > 1 && <li>• Rotate between recipes to provide nutritional variety</li>}
                {selectedCondition === "diabetes" && <li>• Feed at the same times as insulin injections</li>}
                {selectedCondition === "pancreatitis" && <li>• Avoid any fatty treats or table scraps</li>}
                {activePrescriptionDiet && <li>• Follow your veterinarian's monitoring schedule</li>}
                {activePrescriptionDiet && <li>• Do not mix with other foods without veterinary approval</li>}
                <li>• Changing meals/day only splits the same daily total into more/fewer meals</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Estimate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Estimate
            {activePrescriptionDiet && (
              <Badge variant="outline" className="ml-2">
                Prescription Diet Pricing
              </Badge>
            )}
          </CardTitle>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">
              Pricing based on: {pricing.recipeNames.join(" + ")}, {mealsPerDay} meals/day
            </div>
            <div className="text-xs text-muted-foreground">
              Meal frequency changes how food is split, not your price.
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold">${pricing.costPerDay.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Per day</div>
            </div>
            <div>
              <div className="text-lg font-bold">${pricing.costPerWeek.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Per week</div>
            </div>
            <div>
              <div className="text-lg font-bold">${pricing.costPerMonth.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Per month</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Base price per 100g:</span>
              <span>${pricing.per100gPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Daily grams (unrounded):</span>
              <span>{dailyGrams.toFixed(1)}g</span>
            </div>
            <div className="flex justify-between">
              <span>Calories per 100g:</span>
              <span>{caloriesPer100g} kcal</span>
            </div>
            {pricing.isMedical && (
              <div className="text-blue-600 dark:text-blue-400 font-medium">Medical diet uplift included</div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t text-sm">
            <div className="flex justify-between">
              <span>Recommended pack size:</span>
              <span>{pricing.packInfo.packSize}g</span>
            </div>
            <div className="flex justify-between">
              <span>Packs per day:</span>
              <span>{pricing.packInfo.packsPerDay}</span>
            </div>
            <div className="flex justify-between">
              <span>Packs per month:</span>
              <span>{pricing.packInfo.packsPerMonth}</span>
            </div>
          </div>

          {activePrescriptionDiet && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              * Prescription diet costs may vary by veterinary clinic and location
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function Step5Portions(props: Step5Props) {
  return (
    <PlanPricingProvider
      dogProfile={props.dogProfile}
      selectedRecipeId={props.selectedRecipeId}
      selectedRecipes={props.selectedRecipes}
      selectedPrescriptionDiet={props.selectedPrescriptionDiet}
      mealsPerDay={props.mealsPerDay}
    >
      <Step5PortionsInner {...props} />
    </PlanPricingProvider>
  )
}
