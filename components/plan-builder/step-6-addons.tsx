"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Plus } from "lucide-react"
import { mockAddOns, calculateEPADHATarget, convertToKg, type DogProfile, type AddOn } from "@/lib/nutrition-calculator"

interface Step6Props {
  dogProfile: Partial<DogProfile>
  selectedAddOns: string[]
  onUpdate: (addOnIds: string[]) => void
}

export function Step6AddOns({ dogProfile, selectedAddOns, onUpdate }: Step6Props) {
  const toggleAddOn = (addOnId: string) => {
    if (selectedAddOns.includes(addOnId)) {
      onUpdate(selectedAddOns.filter((id) => id !== addOnId))
    } else {
      onUpdate([...selectedAddOns, addOnId])
    }
  }

  const weightKg =
    dogProfile.weight && dogProfile.weightUnit ? convertToKg(dogProfile.weight, dogProfile.weightUnit) : 0
  const epaTarget = calculateEPADHATarget(weightKg)

  const calculateAddOnDose = (addOn: AddOn) => {
    if (addOn.type === "fish-oil" && weightKg > 0) {
      // Calculate ml needed to reach EPA target
      const mlNeeded = epaTarget / (addOn.epaPerMl || 1)
      return `${mlNeeded.toFixed(1)} ml daily`
    }
    if (addOn.type === "probiotic") {
      return "1 scoop daily"
    }
    if (addOn.type === "joint") {
      return "1 tablet daily"
    }
    return "As directed"
  }

  const getTotalNutrientBoost = () => {
    const fishOil = mockAddOns.find((a) => a.id === "fish-oil")
    const isSelected = selectedAddOns.includes("fish-oil")

    if (fishOil && isSelected && weightKg > 0) {
      const mlNeeded = epaTarget / (fishOil.epaPerMl || 1)
      const totalEPA = mlNeeded * (fishOil.epaPerMl || 0)
      const totalDHA = mlNeeded * (fishOil.dhaPerMl || 0)
      return { epa: totalEPA, dha: totalDHA }
    }
    return { epa: 0, dha: 0 }
  }

  const nutrientBoost = getTotalNutrientBoost()
  const totalMonthlyCost = selectedAddOns.reduce((total, addOnId) => {
    const addOn = mockAddOns.find((a) => a.id === addOnId)
    return total + (addOn?.pricePerMonth || 0)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Add-ons Selection */}
      <div className="grid gap-6">
        {mockAddOns.map((addOn) => {
          const isSelected = selectedAddOns.includes(addOn.id)
          return (
            <Card
              key={addOn.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${isSelected ? "ring-2 ring-primary" : ""}`}
              onClick={() => toggleAddOn(addOn.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-manrope text-lg font-bold">{addOn.name}</h3>
                      {isSelected && (
                        <div className="bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium mb-2">Benefits:</div>
                        <div className="text-sm text-muted-foreground">
                          {addOn.type === "fish-oil" &&
                            "Supports skin, coat, and joint health with omega-3 fatty acids"}
                          {addOn.type === "probiotic" && "Promotes digestive health and immune system support"}
                          {addOn.type === "joint" && "Supports joint health and mobility with glucosamine"}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium mb-2">Dosage:</div>
                        <div className="text-sm text-muted-foreground">{calculateAddOnDose(addOn)}</div>
                      </div>
                    </div>

                    {/* Nutritional Info */}
                    <div className="flex flex-wrap gap-2">
                      {addOn.epaPerMl && (
                        <Badge variant="outline" className="text-xs">
                          {addOn.epaPerMl} mg EPA/ml
                        </Badge>
                      )}
                      {addOn.dhaPerMl && (
                        <Badge variant="outline" className="text-xs">
                          {addOn.dhaPerMl} mg DHA/ml
                        </Badge>
                      )}
                      {addOn.cfuPerServing && (
                        <Badge variant="outline" className="text-xs">
                          {(addOn.cfuPerServing / 1000000000).toFixed(1)}B CFU
                        </Badge>
                      )}
                      {addOn.glucosaminePerServing && (
                        <Badge variant="outline" className="text-xs">
                          {addOn.glucosaminePerServing} mg Glucosamine
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <div className="text-lg font-bold">${addOn.pricePerMonth}</div>
                    <div className="text-xs text-muted-foreground">per month</div>
                    <Button variant={isSelected ? "default" : "outline"} size="sm">
                      {isSelected ? "Added" : "Add"}
                      {!isSelected && <Plus className="ml-1 h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Nutritional Summary */}
      {selectedAddOns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Nutritional Boost</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {nutrientBoost.epa > 0 && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">+{Math.round(nutrientBoost.epa)} mg</div>
                  <div className="text-sm text-muted-foreground">EPA (omega-3)</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">+{Math.round(nutrientBoost.dha)} mg</div>
                  <div className="text-sm text-muted-foreground">DHA (omega-3)</div>
                </div>
              </div>
            )}

            {selectedAddOns.includes("probiotic") && (
              <div className="text-center">
                <div className="text-lg font-bold text-primary">+2B CFU</div>
                <div className="text-sm text-muted-foreground">Beneficial bacteria daily</div>
              </div>
            )}

            {selectedAddOns.includes("joint-blend") && (
              <div className="text-center">
                <div className="text-lg font-bold text-primary">+500 mg</div>
                <div className="text-sm text-muted-foreground">Glucosamine daily</div>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total add-ons cost:</span>
                <span className="text-lg font-bold">${totalMonthlyCost.toFixed(2)}/month</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h4 className="font-semibold">Personalized recommendations:</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {weightKg > 0 && (
                <div>
                  • Your dog needs approximately {Math.round(epaTarget)} mg of EPA+DHA daily for optimal coat and joint
                  health
                </div>
              )}
              <div>• Probiotics are especially beneficial if your dog has digestive sensitivities</div>
              <div>• Joint support becomes more important for dogs over 7 years old or large breeds</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
