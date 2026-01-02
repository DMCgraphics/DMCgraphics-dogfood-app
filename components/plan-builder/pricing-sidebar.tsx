"use client"

import { memo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ShoppingCart, Truck, Check } from "lucide-react"
import { PlanPricingProvider, usePlanPricing } from "@/lib/plan-pricing-context"
import { Skeleton } from "@/components/ui/skeleton"
import type { DogProfile } from "@/lib/nutrition-calculator"
import { cn } from "@/lib/utils"

interface PricingSidebarProps {
  dogProfile: Partial<DogProfile>
  selectedRecipes?: string[]
  selectedAddOns?: string[]
  mealsPerDay?: number
  currentStep: number
  mobile?: boolean
  className?: string
}

function PricingSidebarContent({
  dogProfile,
  selectedRecipes = [],
  selectedAddOns = [],
  mobile = false,
  className,
}: Omit<PricingSidebarProps, "currentStep">) {
  const [isOpen, setIsOpen] = useState(false)
  const { pricing } = usePlanPricing()

  // Calculate add-ons cost ($ 10 each per 2 weeks)
  const addOnsCost = selectedAddOns.length * 10
  const weeklyAddOnsCost = addOnsCost / 2

  // Total weekly cost
  const totalWeeklyCost = pricing.costPerWeek + weeklyAddOnsCost
  const biweeklyCost = totalWeeklyCost * 2

  // Check if we have enough data to show pricing
  const hasData = dogProfile.weight && dogProfile.age
  const hasRecipe = selectedRecipes.length > 0
  const canShowPrice = hasData && (hasRecipe || pricing.costPerWeek > 0)

  // Mobile collapsed view
  if (mobile) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
        <CollapsibleTrigger asChild>
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Your Plan:</span>
                  {canShowPrice ? (
                    <span className="text-lg font-bold text-primary">
                      ${totalWeeklyCost.toFixed(0)}/week
                    </span>
                  ) : hasData ? (
                    <span className="text-sm text-muted-foreground">Select recipe</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Calculating...</span>
                  )}
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <Card className="mt-2 border-2 border-primary/20">
            <CardContent className="p-4 space-y-4">
              {/* Dog Info */}
              {dogProfile.name && (
                <div className="text-sm">
                  <span className="font-medium">For:</span> {dogProfile.name}
                  {dogProfile.weight && (
                    <span className="text-muted-foreground">
                      {" "}• {dogProfile.weight} {dogProfile.weightUnit || "lbs"}
                    </span>
                  )}
                </div>
              )}

              {/* Selected Recipes */}
              {selectedRecipes.length > 0 && pricing.recipeNames.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Recipe(s):</div>
                  {pricing.recipeNames.map((name, idx) => (
                    <div key={idx} className="text-sm flex items-center gap-1">
                      <Check className="h-3 w-3 text-primary" />
                      {name}
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t pt-3 space-y-2">
                {/* Food Cost */}
                <div className="flex justify-between text-sm">
                  <span>Food</span>
                  <span className="font-medium">${pricing.costPerWeek.toFixed(0)}/week</span>
                </div>

                {/* Add-ons */}
                {selectedAddOns.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Add-ons ({selectedAddOns.length})</span>
                    <span className="font-medium">${weeklyAddOnsCost.toFixed(0)}/week</span>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between font-bold text-base pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">${totalWeeklyCost.toFixed(0)}/week</span>
                </div>
              </div>

              {/* Delivery Note */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                <Truck className="h-3 w-3" />
                <span>Delivered every 2 weeks (${biweeklyCost.toFixed(0)})</span>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  // Desktop sticky sidebar
  return (
    <div className={cn("sticky top-8", className)}>
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Your Plan Summary
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {!hasData ? (
            // Loading state
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <>
              {/* Dog Info */}
              {dogProfile.name && (
                <div className="pb-3 border-b">
                  <div className="font-semibold">{dogProfile.name}</div>
                  {dogProfile.weight && (
                    <div className="text-sm text-muted-foreground">
                      {dogProfile.weight} {dogProfile.weightUnit || "lbs"}
                      {dogProfile.age && (
                        <span>
                          {" "}• {dogProfile.age} {dogProfile.ageUnit || "years"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Selected Recipes */}
              {selectedRecipes.length > 0 && pricing.recipeNames.length > 0 && (
                <div className="space-y-2 pb-3 border-b">
                  <div className="text-sm font-medium text-muted-foreground">
                    Selected Recipe{pricing.recipeNames.length > 1 ? "s" : ""}:
                  </div>
                  {pricing.recipeNames.map((name, idx) => (
                    <div key={idx} className="text-sm flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Pricing Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base food cost</span>
                  <span className="font-medium">${pricing.costPerWeek.toFixed(0)}/week</span>
                </div>

                {/* Add-ons */}
                {selectedAddOns.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Add-ons ({selectedAddOns.length})
                    </span>
                    <span className="font-medium">${weeklyAddOnsCost.toFixed(0)}/week</span>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between pt-3 border-t">
                  <span className="font-semibold">Weekly Total</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      ${totalWeeklyCost.toFixed(0)}
                    </div>
                    <div className="text-xs text-muted-foreground">per week</div>
                  </div>
                </div>
              </div>

              {/* Delivery Schedule */}
              <div className="pt-3 border-t space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Free local delivery</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Delivered every 2 weeks (${biweeklyCost.toFixed(0)} per delivery)
                </div>
              </div>

              {/* Satisfaction Badge */}
              <div className="pt-3 border-t">
                <Badge variant="secondary" className="w-full justify-center py-2">
                  <Check className="h-3 w-3 mr-1" />
                  100% Satisfaction Guarantee
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Wrap with PlanPricingProvider and memo for performance
export const PricingSidebar = memo(function PricingSidebar({
  dogProfile,
  selectedRecipes = [],
  selectedAddOns = [],
  mealsPerDay = 2,
  currentStep,
  mobile = false,
  className,
}: PricingSidebarProps) {
  // Only show if we're past step 0
  if (currentStep < 1) {
    return null
  }

  return (
    <PlanPricingProvider
      dogProfile={dogProfile}
      selectedRecipes={selectedRecipes}
      mealsPerDay={mealsPerDay}
    >
      <PricingSidebarContent
        dogProfile={dogProfile}
        selectedRecipes={selectedRecipes}
        selectedAddOns={selectedAddOns}
        mobile={mobile}
        className={className}
      />
    </PlanPricingProvider>
  )
})
