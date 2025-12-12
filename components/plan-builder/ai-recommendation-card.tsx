"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, Brain, TrendingUp, ChevronDown, ChevronUp, Info, AlertTriangle } from "lucide-react"
import type { AIRecommendation } from "@/lib/multi-dog-types"
import { mockRecipes } from "@/lib/nutrition-calculator"
import { ConfidenceVisualization } from "./confidence-visualization"
import { cn } from "@/lib/utils"

interface AIRecommendationCardProps {
  recommendation: AIRecommendation
  onSelectRecipe: (recipeId: string) => void
  selectedRecipe: string | null
}

export function AIRecommendationCard({ recommendation, onSelectRecipe, selectedRecipe }: AIRecommendationCardProps) {
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [showMissingData, setShowMissingData] = useState(true)

  const recommendedRecipes = recommendation.recommendedRecipes
    .map((id) => mockRecipes.find((r) => r.id === id))
    .filter(Boolean)

  const alternativeRecipes = recommendation.alternativeRecommendations
    ?.map((alt) => ({
      ...alt,
      recipe: mockRecipes.find((r) => r.id === alt.recipeId),
    }))
    .filter((alt) => alt.recipe)

  const hasAlternatives = alternativeRecipes && alternativeRecipes.length > 0
  const hasMissingData = recommendation.missingData && recommendation.missingData.length > 0
  const hasEdgeCases = recommendation.edgeCases && recommendation.edgeCases.length > 0

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
          <Sparkles className="h-5 w-5" />
          AI Recommendations for {recommendation.dogName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Edge Cases Warning */}
        {hasEdgeCases && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-amber-900 mb-1">Important Considerations</div>
                <ul className="space-y-1">
                  {recommendation.edgeCases!.map((edgeCase, i) => (
                    <li key={i} className="text-xs text-amber-800">
                      • {edgeCase}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Confidence Visualization */}
        <ConfidenceVisualization
          confidence={recommendation.confidence}
          confidenceBreakdown={recommendation.confidenceBreakdown}
          factorsConsidered={recommendation.factorsConsidered}
          dogName={recommendation.dogName}
        />

        {/* AI Reasoning */}
        <div className="p-3 bg-white/60 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Brain className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                Why This Recommendation
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200">{recommendation.reasoning}</p>
            </div>
          </div>
        </div>

        {/* Missing Data Notice */}
        {hasMissingData && showMissingData && (
          <div className="p-3 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-sky-600 dark:text-sky-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium text-sky-900 dark:text-sky-100">Could Improve Confidence</div>
                  <Button variant="ghost" size="sm" className="h-auto p-0" onClick={() => setShowMissingData(false)}>
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                </div>
                <ul className="space-y-1">
                  {recommendation.missingData!.map((item, i) => (
                    <li key={i} className="text-xs text-sky-800 dark:text-sky-200">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

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
          <div className="text-sm font-medium">Top Recommendations:</div>
          {recommendedRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-all",
                selectedRecipe === recipe.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
                  : "border-border bg-white/60 dark:bg-blue-900/10 hover:bg-white/80 dark:hover:bg-blue-900/20"
              )}
              onClick={() => onSelectRecipe(recipe.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{recipe.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {recipe.protein}% protein • {recipe.fat}% fat • {recipe.kcalPer100g} kcal/100g
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

        {/* Alternative Recommendations */}
        {hasAlternatives && (
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAlternatives(!showAlternatives)}
              className="w-full justify-between text-sm font-medium"
            >
              <span>Alternative Options ({alternativeRecipes!.length})</span>
              {showAlternatives ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showAlternatives && (
              <div className="space-y-2">
                {alternativeRecipes!.map((alt, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      selectedRecipe === alt.recipeId
                        ? "border-primary bg-primary/5"
                        : "border-border bg-white/40 hover:bg-white/60"
                    )}
                    onClick={() => onSelectRecipe(alt.recipeId)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{alt.recipe!.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {alt.recipe!.protein}% protein • {alt.recipe!.fat}% fat
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {alt.confidence}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{alt.reasoning}</p>
                    <p className="text-xs text-muted-foreground italic">Why lower: {alt.differenceFromTop}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
