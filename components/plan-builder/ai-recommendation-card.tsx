"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, Brain, TrendingUp } from "lucide-react"
import type { AIRecommendation } from "@/lib/multi-dog-types"
import { mockRecipes } from "@/lib/nutrition-calculator"

interface AIRecommendationCardProps {
  recommendation: AIRecommendation
  onSelectRecipe: (recipeId: string) => void
  selectedRecipe: string | null
}

export function AIRecommendationCard({ recommendation, onSelectRecipe, selectedRecipe }: AIRecommendationCardProps) {
  const recommendedRecipes = recommendation.recommendedRecipes
    .map((id) => mockRecipes.find((r) => r.id === id))
    .filter(Boolean)

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
          <Sparkles className="h-5 w-5" />
          AI Recommendations for {recommendation.dogName}
          <Badge variant="outline" className="ml-auto text-xs">
            {recommendation.confidence}% match
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Reasoning */}
        <div className="p-3 bg-white/60 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Brain className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800 dark:text-blue-200">{recommendation.reasoning}</p>
          </div>
        </div>

        {/* Nutritional Focus Areas */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            Nutritional Focus Areas:
          </div>
          <div className="flex flex-wrap gap-1">
            {recommendation.nutritionalFocus.map((focus) => (
              <Badge key={focus} variant="secondary" className="text-xs">
                {focus.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </Badge>
            ))}
          </div>
        </div>

        {/* Recommended Recipes */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Recommended Recipes:</div>
          {recommendedRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedRecipe === recipe.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-white/60 dark:bg-blue-900/10 hover:bg-white/80 dark:hover:bg-blue-900/20"
              }`}
              onClick={() => onSelectRecipe(recipe.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{recipe.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {recipe.protein}% protein • {recipe.kcalPer100g} kcal/100g
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={selectedRecipe === recipe.id ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectRecipe(recipe.id)
                  }}
                >
                  {selectedRecipe === recipe.id ? "Selected" : "Select"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
