"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { commonAllergens, mockRecipes } from "@/lib/nutrition-calculator"
import { AllergenImpactHelper } from "./ai-inline-helper"

interface Step3Props {
  selectedAllergens: string[]
  onUpdate: (allergens: string[]) => void
  dogName?: string
}

export function Step3Allergies({ selectedAllergens, onUpdate, dogName }: Step3Props) {
  const toggleAllergen = (allergen: string) => {
    if (selectedAllergens.includes(allergen)) {
      onUpdate(selectedAllergens.filter((a) => a !== allergen))
    } else {
      onUpdate([...selectedAllergens, allergen])
    }
  }

  const removeAllergen = (allergen: string) => {
    onUpdate(selectedAllergens.filter((a) => a !== allergen))
  }

  // Calculate available recipes after filtering
  const availableRecipes = mockRecipes.filter((recipe) => {
    if (selectedAllergens.length === 0) return true
    return !recipe.allergens.some((allergen) => selectedAllergens.includes(allergen))
  }).length

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Allergies & Food Exclusions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select any ingredients your dog is allergic to or that you'd prefer to avoid. We'll filter recipes
              accordingly.
            </p>

            {/* Common Allergens Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {commonAllergens.map((allergen) => (
                <Button
                  key={allergen}
                  variant={selectedAllergens.includes(allergen) ? "default" : "outline"}
                  onClick={() => toggleAllergen(allergen)}
                  className="justify-start capitalize"
                >
                  {allergen}
                </Button>
              ))}
            </div>
          </div>

          {/* Selected Allergens */}
          {selectedAllergens.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Selected Exclusions:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedAllergens.map((allergen) => (
                  <Badge key={allergen} variant="secondary" className="flex items-center gap-1">
                    <span className="capitalize">{allergen}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAllergen(allergen)}
                      className="h-auto p-0 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Allergy Guard Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <div className="w-4 h-4 rounded-full bg-primary"></div>
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold">Allergy Guard Protection</h4>
              <p className="text-sm text-muted-foreground">
                Our system will automatically hide any recipes containing your selected allergens. You'll only see safe
                options for your dog.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Allergen Impact Helper */}
      {selectedAllergens.length > 0 && dogName && (
        <AllergenImpactHelper
          dogName={dogName}
          selectedAllergens={selectedAllergens}
          availableRecipes={availableRecipes}
          totalRecipes={mockRecipes.length}
        />
      )}
    </div>
  )
}
