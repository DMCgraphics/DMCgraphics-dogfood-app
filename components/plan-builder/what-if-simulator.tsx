"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FlaskConical, TrendingUp, TrendingDown, ArrowRight, Info } from "lucide-react"
import { generateAIMealRecommendations } from "@/lib/ai-meal-recommendations"
import type { MultiDogProfile } from "@/lib/multi-dog-types"
import { mockRecipes } from "@/lib/nutrition-calculator"
import { cn } from "@/lib/utils"

interface WhatIfSimulatorProps {
  dogProfile: MultiDogProfile
  currentRecommendation: {
    recipeId: string
    confidence: number
  }
}

type ScenarioType = 'activity' | 'weightGoal' | 'bodyCondition'

interface Scenario {
  id: string
  type: ScenarioType
  label: string
  description: string
  icon: React.ReactNode
  getValue: (profile: MultiDogProfile) => any
  setValue: (profile: MultiDogProfile, value: any) => MultiDogProfile
}

export function WhatIfSimulator({ dogProfile, currentRecommendation }: WhatIfSimulatorProps) {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)

  const scenarios: Scenario[] = [
    {
      id: 'activity-high',
      type: 'activity',
      label: 'High Activity',
      description: 'If your dog was very active (lots of exercise)',
      icon: <TrendingUp className="h-4 w-4" />,
      getValue: (p) => p.activity,
      setValue: (p, value) => ({ ...p, activity: 'high' as const })
    },
    {
      id: 'activity-low',
      type: 'activity',
      label: 'Low Activity',
      description: 'If your dog was mostly inactive',
      icon: <TrendingDown className="h-4 w-4" />,
      getValue: (p) => p.activity,
      setValue: (p, value) => ({ ...p, activity: 'low' as const })
    },
    {
      id: 'weight-lose',
      type: 'weightGoal',
      label: 'Weight Loss Goal',
      description: 'If you wanted to reduce weight',
      icon: <TrendingDown className="h-4 w-4" />,
      getValue: (p) => p.healthGoals?.weightGoal,
      setValue: (p, value) => ({
        ...p,
        healthGoals: {
          ...p.healthGoals,
          weightGoal: 'lose' as const,
          targetWeight: p.weight ? Math.round(p.weight * 0.9 * 10) / 10 : undefined
        }
      })
    },
    {
      id: 'weight-gain',
      type: 'weightGoal',
      label: 'Weight Gain Goal',
      description: 'If you wanted to increase weight',
      icon: <TrendingUp className="h-4 w-4" />,
      getValue: (p) => p.healthGoals?.weightGoal,
      setValue: (p, value) => ({
        ...p,
        healthGoals: {
          ...p.healthGoals,
          weightGoal: 'gain' as const,
          targetWeight: p.weight ? Math.round(p.weight * 1.1 * 10) / 10 : undefined
        }
      })
    },
    {
      id: 'bc-thin',
      type: 'bodyCondition',
      label: 'Underweight (BCS 3)',
      description: 'If body condition was underweight',
      icon: <TrendingDown className="h-4 w-4" />,
      getValue: (p) => p.bodyCondition,
      setValue: (p, value) => ({ ...p, bodyCondition: 3 })
    },
    {
      id: 'bc-heavy',
      type: 'bodyCondition',
      label: 'Overweight (BCS 7)',
      description: 'If body condition was overweight',
      icon: <TrendingUp className="h-4 w-4" />,
      getValue: (p) => p.bodyCondition,
      setValue: (p, value) => ({ ...p, bodyCondition: 7 })
    }
  ]

  // Filter out scenarios that match current state
  const availableScenarios = scenarios.filter(scenario => {
    const currentValue = scenario.getValue(dogProfile)
    if (scenario.type === 'activity') {
      return currentValue !== scenario.setValue(dogProfile, null).activity
    }
    if (scenario.type === 'weightGoal') {
      return currentValue !== scenario.setValue(dogProfile, null).healthGoals?.weightGoal
    }
    if (scenario.type === 'bodyCondition') {
      return currentValue !== scenario.setValue(dogProfile, null).bodyCondition
    }
    return true
  })

  const simulatedResult = useMemo(() => {
    if (!selectedScenario) return null

    const scenario = scenarios.find(s => s.id === selectedScenario)
    if (!scenario) return null

    const modifiedProfile = scenario.setValue(dogProfile, null)
    const recommendations = generateAIMealRecommendations([modifiedProfile])

    if (recommendations.length === 0) return null

    const topRecipe = mockRecipes.find(r => r.id === recommendations[0].recommendedRecipes[0])

    return {
      recipeName: topRecipe?.name || 'Unknown',
      recipeId: recommendations[0].recommendedRecipes[0],
      confidence: recommendations[0].confidence,
      reasoning: recommendations[0].reasoning,
      confidenceDiff: recommendations[0].confidence - currentRecommendation.confidence,
      isNewRecipe: recommendations[0].recommendedRecipes[0] !== currentRecommendation.recipeId
    }
  }, [selectedScenario, dogProfile, currentRecommendation, scenarios])

  if (availableScenarios.length === 0) {
    return null
  }

  return (
    <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
          <FlaskConical className="h-5 w-5" />
          What If Simulator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Explore how changes to {dogProfile.name}'s profile would affect recommendations
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scenario Selection */}
        <div>
          <div className="text-sm font-medium mb-2">Try a scenario:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {availableScenarios.map(scenario => (
              <Button
                key={scenario.id}
                variant={selectedScenario === scenario.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedScenario(scenario.id)}
                className={cn(
                  "justify-start h-auto py-2",
                  selectedScenario === scenario.id && "bg-purple-600 hover:bg-purple-700"
                )}
              >
                <div className="flex items-start gap-2 w-full">
                  {scenario.icon}
                  <div className="text-left flex-1">
                    <div className="font-medium text-sm">{scenario.label}</div>
                    <div className="text-xs opacity-80 font-normal">{scenario.description}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Simulated Result */}
        {simulatedResult && (
          <div className="mt-4 p-4 bg-white/60 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3 mb-3">
              <Info className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
                  Simulated Result
                </div>
                <p className="text-xs text-muted-foreground">
                  This shows what would change with the selected scenario
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Recipe Change */}
              {simulatedResult.isNewRecipe ? (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200">
                    New Recipe
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{simulatedResult.recipeName}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">Same Recipe</Badge>
                  <span className="text-muted-foreground">{simulatedResult.recipeName}</span>
                </div>
              )}

              {/* Confidence Change */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Confidence:</span>
                <span className="font-semibold">{simulatedResult.confidence}%</span>
                {simulatedResult.confidenceDiff !== 0 && (
                  <Badge
                    variant="outline"
                    className={cn(
                      simulatedResult.confidenceDiff > 0
                        ? "text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                        : "text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                    )}
                  >
                    {simulatedResult.confidenceDiff > 0 ? "+" : ""}
                    {simulatedResult.confidenceDiff}%
                  </Badge>
                )}
              </div>

              {/* Reasoning */}
              <div className="text-xs text-muted-foreground italic pt-2 border-t">
                {simulatedResult.reasoning}
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground italic">
          These are simulations only - your current recommendations remain unchanged
        </div>
      </CardContent>
    </Card>
  )
}
