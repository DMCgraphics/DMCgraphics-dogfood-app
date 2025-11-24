"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Download, User } from "lucide-react"
import { PricingClarityCard } from "@/components/ui/pricing-clarity-card"
import {
  calculateDERFromProfile,
  mockRecipes,
  mockAddOns,
  type DogProfile,
  type HealthGoals,
} from "@/lib/nutrition-calculator"
import { prescriptionDiets } from "@/lib/prescription-diets"
import { PlanPricingProvider, usePlanPricing } from "@/lib/plan-pricing-context"

// Topper pricing by dog size (prices are bi-weekly) - for display only
// The actual price IDs are handled in plan-builder/page.tsx based on test/production mode
const topperPrices: Record<string, Record<string, { price: number }>> = {
  small: {
    "25": { price: 6.50 },
    "50": { price: 13.00 },
    "75": { price: 19.50 },
  },
  medium: {
    "25": { price: 10.50 },
    "50": { price: 21.00 },
    "75": { price: 31.50 },
  },
  large: {
    "25": { price: 15.50 },
    "50": { price: 31.00 },
    "75": { price: 46.50 },
  },
  xl: {
    "25": { price: 19.50 },
    "50": { price: 39.00 },
    "75": { price: 58.50 },
  },
}

function getDogSizeCategory(weightLbs: number): string {
  if (weightLbs < 20) return "small"
  if (weightLbs < 50) return "medium"
  if (weightLbs < 100) return "large"
  return "xl"
}

interface PlanReviewProps {
  dogProfile: Partial<DogProfile>
  healthGoals: Partial<HealthGoals>
  selectedAllergens: string[]
  selectedRecipeId: string | null
  selectedRecipes?: string[]
  mealsPerDay: number
  selectedAddOns: string[]
  selectedPrescriptionDiet?: string | null
  onProceedToCheckout: () => void
  onCreateAccount?: () => void
  isAuthenticated?: boolean
  currentDogIndex?: number
  totalDogs?: number
  isLastDog?: boolean
  onMealsPerDayUpdate?: (meals: number) => void
  onAddOnsUpdate?: (addOns: string[]) => void
  planType?: "full" | "topper"
  topperLevel?: "25" | "50" | "75" | null
}

function PlanReviewInner({
  dogProfile,
  healthGoals,
  selectedAllergens,
  selectedRecipeId,
  selectedRecipes = [],
  mealsPerDay,
  selectedAddOns,
  selectedPrescriptionDiet,
  onProceedToCheckout,
  onCreateAccount,
  isAuthenticated = false,
  currentDogIndex = 0,
  totalDogs = 1,
  isLastDog = true,
  planType = "full",
  topperLevel = null,
}: PlanReviewProps) {
  const { pricing, gramsPerMeal } = usePlanPricing()

  // Calculate topper pricing if applicable
  const isTopperPlan = planType === "topper" && topperLevel
  const weightLbs = dogProfile.weight && dogProfile.weightUnit === "kg"
    ? dogProfile.weight * 2.20462
    : dogProfile.weight || 0
  const dogSizeCategory = getDogSizeCategory(weightLbs)
  const topperPricing = isTopperPlan ? topperPrices[dogSizeCategory]?.[topperLevel] : null

  const hasSelectedRecipes = selectedRecipeId || selectedRecipes.length > 0 || selectedPrescriptionDiet
  const hasRequiredDogInfo = dogProfile.weight && dogProfile.weightUnit

  if (!hasSelectedRecipes || !hasRequiredDogInfo || !pricing.activeCaloriesPer100g) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Unable to generate plan. Please complete all steps.</p>
        </CardContent>
      </Card>
    )
  }

  let displayRecipes: any[] = []

  if (selectedPrescriptionDiet) {
    const prescriptionRecipe = prescriptionDiets.find((d) => d.id === selectedPrescriptionDiet)
    if (prescriptionRecipe) {
      displayRecipes = [prescriptionRecipe]
    }
  } else if (selectedRecipes.length > 0) {
    displayRecipes = selectedRecipes.map((id) => mockRecipes.find((r) => r.id === id)).filter(Boolean)
  } else if (selectedRecipeId) {
    const recipe = mockRecipes.find((r) => r.id === selectedRecipeId)
    if (recipe) {
      displayRecipes = [recipe]
    }
  }

  const dailyGrams = pricing.dailyGrams
  const foodCostPerDay = pricing.costPerDay
  const currentGramsPerMeal = gramsPerMeal(mealsPerDay)

  const der = calculateDERFromProfile(dogProfile as DogProfile)

  const selectedAddOnItems = mockAddOns.filter((a) => selectedAddOns.includes(a.id))
  const addOnsCostPerBiweek = selectedAddOnItems.reduce((total, addOn) => {
    return total + 10.0 // $10 per 2 weeks (was $5/week)
  }, 0)

  // Use topper pricing if it's a topper plan, otherwise use full meal pricing
  const foodCostBiweekly = isTopperPlan && topperPricing
    ? topperPricing.price
    : pricing.costPerWeek * 2
  const totalBiweeklyCost = foodCostBiweekly + addOnsCostPerBiweek

  // Calculate topper-adjusted daily grams
  const topperPercentage = isTopperPlan ? parseInt(topperLevel || "25") / 100 : 1
  const adjustedDailyGrams = isTopperPlan ? dailyGrams * topperPercentage : dailyGrams

  const handleDownload = () => {
    const recipeNames = displayRecipes.map((r) => r.name).join(", ")
    const planSummary = `
NouriPet Nutrition Plan for ${dogProfile.name || 'Your Dog'}

DOG PROFILE:
- Weight: ${dogProfile.weight} ${dogProfile.weightUnit}
- Age: ${dogProfile.age} ${dogProfile.ageUnit}
- Breed: ${dogProfile.breed}
- Activity: ${dogProfile.activity}

SELECTED RECIPE${displayRecipes.length > 1 ? "S" : ""}:
- ${recipeNames}

DAILY FEEDING:
- Total: ${Math.round(dailyGrams)}g per day
- Meals: ${mealsPerDay} meals of ${Math.round(currentGramsPerMeal)}g each
- Calories: ${Math.round(der)} kcal per day

ADD-ONS:
${selectedAddOnItems.map((addOn) => `- ${addOn.name}`).join("\n")}

ESTIMATED COST: $${totalBiweeklyCost.toFixed(2)} every 2 weeks
DELIVERY FREQUENCY: Every 2 weeks

Generated by NouriPet - Fresh food, fully explained.
    `

    const blob = new Blob([planSummary], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${dogProfile.name || 'Your Dog'}-nutrition-plan.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <PricingClarityCard
        recipeNames={pricing.recipeNames}
        mealsPerDay={mealsPerDay}
        isMultiRecipe={displayRecipes.length > 1}
        isMedical={pricing.isMedical}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {dogProfile.name || 'Your Dog'}'s {isTopperPlan ? `${topperLevel}% Topper` : "Full Meal"} Plan
            {totalDogs > 1 && (
              <span className="text-lg text-muted-foreground ml-2">
                ({currentDogIndex + 1} of {totalDogs})
              </span>
            )}
          </CardTitle>
          <div className="text-sm text-muted-foreground space-y-1">
            {isTopperPlan ? (
              <>
                <div>
                  {topperLevel}% fresh food topper - mix with {100 - parseInt(topperLevel || "25")}% kibble
                </div>
                <div className="text-xs">
                  Add fresh nutrition on top of your dog's current diet
                </div>
              </>
            ) : (
              <>
                <div>
                  Pricing based on: {pricing.recipeNames.join(" + ")}, {mealsPerDay} meals/day
                </div>
                <div className="text-xs">
                  Your total daily nutrition cost, split across {mealsPerDay} meal{mealsPerDay > 1 ? "s" : ""}
                </div>
              </>
            )}
            {totalDogs > 1 && !isLastDog && (
              <div className="text-xs text-primary font-medium">
                After reviewing this plan, you'll continue to the next dog.
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{Math.round(adjustedDailyGrams)}g</div>
              <div className="text-sm text-muted-foreground">
                {isTopperPlan ? "Fresh food daily" : "Daily food"}
              </div>
              {isTopperPlan && (
                <div className="text-xs text-muted-foreground">
                  ({topperLevel}% of {Math.round(dailyGrams)}g total)
                </div>
              )}
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {isTopperPlan ? topperLevel : mealsPerDay}
              </div>
              <div className="text-sm text-muted-foreground">
                {isTopperPlan ? "% fresh food" : "Meals per day"}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">${totalBiweeklyCost.toFixed(0)}</div>
              <div className="text-sm text-muted-foreground">Every 2 weeks</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dog Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Dog Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Name:</span> {dogProfile.name || 'Your Dog'}
            </div>
            <div>
              <span className="font-medium">Weight:</span> {dogProfile.weight} {dogProfile.weightUnit}
            </div>
            <div>
              <span className="font-medium">Age:</span> {dogProfile.age} {dogProfile.ageUnit}
            </div>
            <div>
              <span className="font-medium">Breed:</span> {dogProfile.breed}
            </div>
            <div>
              <span className="font-medium">Activity:</span> {dogProfile.activity}
            </div>
            <div>
              <span className="font-medium">Body Condition:</span> {dogProfile.bodyCondition}/9
            </div>
          </div>

          {selectedAllergens.length > 0 && (
            <div className="pt-3 border-t">
              <div className="text-sm font-medium mb-2">Avoiding:</div>
              <div className="flex flex-wrap gap-1">
                {selectedAllergens.map((allergen) => (
                  <Badge key={allergen} variant="outline" className="text-xs capitalize">
                    {allergen}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Recipe(s) */}
      <Card>
        <CardHeader>
          <CardTitle>Selected Recipe{displayRecipes.length > 1 ? "s" : ""}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {displayRecipes.map((recipe, index) => (
            <div key={recipe.id} className={index > 0 ? "pt-4 border-t" : ""}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{recipe.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {recipe.kcalPer100g} kcal per 100g • Vacuum sealed packs
                  </p>
                </div>
                <Badge variant="secondary">{recipe.aafcoLifeStage}</Badge>
              </div>

              <div className="grid grid-cols-4 gap-4 text-center text-sm mt-3">
                <div>
                  <div className="font-bold text-primary">{recipe.protein}%</div>
                  <div className="text-muted-foreground">Protein</div>
                </div>
                <div>
                  <div className="font-bold text-primary">{recipe.fat}%</div>
                  <div className="text-muted-foreground">Fat</div>
                </div>
                <div>
                  <div className="font-bold text-primary">{recipe.carbs}%</div>
                  <div className="text-muted-foreground">Carbs</div>
                </div>
                <div>
                  <div className="font-bold text-primary">{recipe.fiber}%</div>
                  <div className="text-muted-foreground">Fiber</div>
                </div>
              </div>
            </div>
          ))}

          {displayRecipes.length > 1 && (
            <div className="mt-4 p-3 bg-primary/5 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Meal Rotation:</strong> Rotate between these recipes to provide variety and balanced nutrition
                for your dog.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feeding Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Feeding Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
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
                  <div className="font-semibold">{Math.round(currentGramsPerMeal)}g</div>
                  <div className="text-xs text-muted-foreground">
                    {(currentGramsPerMeal / pricing.packInfo.packSize).toFixed(1)} × {pricing.packInfo.packSize}g packs
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add-ons */}
      {selectedAddOnItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Add-ons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedAddOnItems.map((addOn) => (
              <div key={addOn.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{addOn.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {addOn.type === "fish-oil" && "Supports skin, coat & joints"}
                    {addOn.type === "probiotic" && "Digestive & immune support"}
                    {addOn.type === "joint" && "Joint health & mobility"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">$10.00</div>
                  <div className="text-xs text-muted-foreground">every 2 weeks</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Biweekly delivery pricing (every 2 weeks)</div>
            <div className="text-xs text-muted-foreground">
              {isTopperPlan
                ? `${topperLevel}% fresh food topper pricing`
                : "Meal frequency changes how food is split, not your price."}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>
              {isTopperPlan
                ? `${topperLevel}% Fresh Food Topper`
                : `Food (${displayRecipes.length > 1 ? "Recipe Variety" : displayRecipes[0]?.name})`}
            </span>
            <span>${foodCostBiweekly.toFixed(2)}/2 weeks</span>
          </div>
          {selectedAddOnItems.map((addOn) => (
            <div key={addOn.id} className="flex justify-between">
              <span>{addOn.name}</span>
              <span>$10.00/2 weeks</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>${totalBiweeklyCost.toFixed(2)} every 2 weeks</span>
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t space-y-1">
            <div className="flex justify-between">
              <span>Biweekly food cost:</span>
              <span>${foodCostBiweekly.toFixed(2)}</span>
            </div>
            {!isTopperPlan && (
              <>
                <div className="flex justify-between">
                  <span>Daily grams (unrounded):</span>
                  <span>{dailyGrams.toFixed(1)}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Average calories per 100g:</span>
                  <span>{pricing.activeCaloriesPer100g} kcal</span>
                </div>
              </>
            )}
            {isTopperPlan && (
              <div className="flex justify-between">
                <span>Fresh food daily:</span>
                <span>{Math.round(adjustedDailyGrams)}g ({topperLevel}% of diet)</span>
              </div>
            )}
            <div className="flex justify-between text-primary font-medium">
              <span>Delivery frequency:</span>
              <span>Every 2 weeks</span>
            </div>
            {pricing.isMedical && (
              <div className="text-blue-600 dark:text-blue-400 font-medium">
                Medical diet therapeutic uplift included
              </div>
            )}
            {!isTopperPlan && displayRecipes.length > 1 && (
              <div className="text-green-600 dark:text-green-400 font-medium">
                Multi-recipe variety plan - averaged nutrition
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {/* Checkout Button - Primary Action */}
        {isAuthenticated && isLastDog && (
          <Button
            onClick={onProceedToCheckout}
            className="w-full bg-[#635bff] hover:bg-[#5a52e8] text-white"
            size="lg"
          >
            Proceed to Checkout - ${totalBiweeklyCost.toFixed(2)} every 2 weeks
          </Button>
        )}
        
        {/* Secondary Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Download Plan
          </Button>
          {!isAuthenticated && onCreateAccount && (
            <Button onClick={onCreateAccount} className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Create Account
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function PlanReview(props: PlanReviewProps) {
  return (
    <PlanPricingProvider
      dogProfile={props.dogProfile}
      selectedRecipeId={props.selectedRecipeId}
      selectedRecipes={props.selectedRecipes}
      selectedPrescriptionDiet={props.selectedPrescriptionDiet}
      mealsPerDay={props.mealsPerDay}
    >
      <PlanReviewInner {...props} />
    </PlanPricingProvider>
  )
}
