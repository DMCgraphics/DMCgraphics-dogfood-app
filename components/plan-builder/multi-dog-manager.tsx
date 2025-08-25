"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Users, Sparkles } from "lucide-react"
import type { MultiDogProfile } from "@/lib/multi-dog-types"
import { generateAIMealRecommendations, generateMealVarietyRecommendations } from "@/lib/ai-meal-recommendations"

interface MultiDogManagerProps {
  dogs: MultiDogProfile[]
  onUpdate: (dogs: MultiDogProfile[]) => void
  onAddDog: () => void
  onRemoveDog: (dogId: string) => void
  onSelectDog: (dogId: string) => void
  selectedDogId: string | null
}

export function MultiDogManager({
  dogs,
  onUpdate,
  onAddDog,
  onRemoveDog,
  onSelectDog,
  selectedDogId,
}: MultiDogManagerProps) {
  const [showAIRecommendations, setShowAIRecommendations] = useState(false)
  const [aiRecommendations, setAIRecommendations] = useState<any>(null)

  const handleGenerateAIRecommendations = () => {
    const recommendations = generateAIMealRecommendations(dogs)
    const varietyRecs = generateMealVarietyRecommendations(dogs)
    setAIRecommendations({ individual: recommendations, variety: varietyRecs })
    setShowAIRecommendations(true)
  }

  return (
    <div className="space-y-6">
      {/* Multi-Dog Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Pack ({dogs.length} {dogs.length === 1 ? "dog" : "dogs"})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {dogs.map((dog) => (
              <div
                key={dog.id}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedDogId === dog.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
                onClick={() => onSelectDog(dog.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-primary">{dog.name?.charAt(0)?.toUpperCase() || "?"}</span>
                  </div>
                  <div>
                    <div className="font-medium">{dog.name || "Unnamed Dog"}</div>
                    <div className="text-sm text-muted-foreground">
                      {dog.breed} • {dog.weight} {dog.weightUnit} • {dog.activity} activity
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {dog.medicalNeeds?.selectedCondition && (
                    <Badge variant="outline" className="text-xs">
                      Medical
                    </Badge>
                  )}
                  {dogs.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveDog(dog.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={onAddDog} variant="outline" className="flex-1 bg-transparent">
              <Plus className="h-4 w-4 mr-2" />
              Add Another Dog
            </Button>
            {dogs.length > 1 && (
              <Button onClick={handleGenerateAIRecommendations} className="flex-1">
                <Sparkles className="h-4 w-4 mr-2" />
                Get AI Meal Recommendations
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      {showAIRecommendations && aiRecommendations && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Sparkles className="h-5 w-5" />
              AI Meal Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Variety Recommendations */}
            <div className="p-4 bg-white dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-semibold mb-2">Multi-Dog Meal Strategy</h4>
              <p className="text-sm text-muted-foreground mb-3">{aiRecommendations.variety.reasoning}</p>

              {aiRecommendations.variety.sharedMeals.length > 0 && (
                <div className="mb-3">
                  <div className="text-sm font-medium mb-1">Shared Meals:</div>
                  <div className="flex flex-wrap gap-1">
                    {aiRecommendations.variety.sharedMeals.map((recipeId: string) => (
                      <Badge key={recipeId} variant="secondary" className="text-xs">
                        {recipeId.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Individual Recommendations */}
            <div className="space-y-3">
              {aiRecommendations.individual.map((rec: any) => (
                <div key={rec.dogId} className="p-3 bg-white dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{rec.dogName}</h4>
                    <Badge variant="outline" className="text-xs">
                      {rec.confidence}% confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{rec.reasoning}</p>
                  <div className="flex flex-wrap gap-1">
                    {rec.nutritionalFocus.map((focus: string) => (
                      <Badge key={focus} variant="secondary" className="text-xs">
                        {focus.replace("-", " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
