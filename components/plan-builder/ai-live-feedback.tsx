"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { AIThinking } from "./ai-loading-skeleton"
import { generateAIMealRecommendations } from "@/lib/ai-meal-recommendations"
import type { MultiDogProfile } from "@/lib/multi-dog-types"

interface AILiveFeedbackProps {
  /**
   * Dog profile data (updates trigger new feedback)
   */
  dogProfile: Partial<MultiDogProfile>

  /**
   * Type of feedback to display
   */
  feedbackType: "body-condition" | "weight-goal" | "activity" | "general"

  /**
   * Optional: Debounce delay in ms (default: 500)
   */
  debounceMs?: number

  /**
   * Optional: className
   */
  className?: string
}

export function AILiveFeedback({
  dogProfile,
  feedbackType,
  debounceMs = 500,
  className,
}: AILiveFeedbackProps) {
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isThinking, setIsThinking] = useState(false)

  // Debounced feedback generation
  const generateFeedback = useCallback(() => {
    if (!dogProfile.name) return

    setIsThinking(true)

    // Simulate AI thinking delay
    setTimeout(() => {
      let message = ""

      // Generate feedback based on type
      if (feedbackType === "body-condition" && dogProfile.bodyCondition) {
        if (dogProfile.bodyCondition <= 3) {
          message = `With a body condition of ${dogProfile.bodyCondition}/9, ${dogProfile.name} would benefit from calorie-dense recipes. I'll suggest higher-fat options to support healthy weight gain.`
        } else if (dogProfile.bodyCondition >= 7) {
          message = `At ${dogProfile.bodyCondition}/9 body condition, ${dogProfile.name} would benefit from a weight management plan. I'll recommend lower-calorie recipes with higher fiber.`
        } else {
          message = `${dogProfile.name}'s body condition (${dogProfile.bodyCondition}/9) looks healthy! I'll find recipes that maintain this ideal weight.`
        }
      } else if (feedbackType === "weight-goal" && dogProfile.healthGoals?.targetWeight && dogProfile.weight) {
        const diff = Math.abs(dogProfile.weight - dogProfile.healthGoals.targetWeight)
        const percent = (diff / dogProfile.weight) * 100

        if (dogProfile.healthGoals.weightGoal === "lose") {
          message = `To help ${dogProfile.name} reach ${dogProfile.healthGoals.targetWeight} ${dogProfile.weightUnit}, I'll suggest recipes with lower fat and higher fiber. This ${percent.toFixed(1)}% change should take about ${Math.ceil(percent / 1.5)} weeks.`
        } else if (dogProfile.healthGoals.weightGoal === "gain") {
          message = `I'll recommend calorie-dense recipes to help ${dogProfile.name} reach ${dogProfile.healthGoals.targetWeight} ${dogProfile.weightUnit} through healthy weight gain.`
        } else {
          message = `Perfect! I'll find balanced recipes to maintain ${dogProfile.name} at ${dogProfile.healthGoals.targetWeight} ${dogProfile.weightUnit}.`
        }
      } else if (feedbackType === "activity") {
        if (dogProfile.activity === "high") {
          message = `With ${dogProfile.name}'s high activity level, I'll prioritize calorie-dense recipes with quality protein to fuel their active lifestyle.`
        } else if (dogProfile.activity === "low") {
          message = `For ${dogProfile.name}'s low activity level, I'll suggest recipes with moderate calories to prevent weight gain.`
        } else {
          message = `${dogProfile.name}'s moderate activity level is great! I'll recommend balanced recipes for their lifestyle.`
        }
      } else if (feedbackType === "general") {
        // Quick AI recommendation preview
        const tempProfile: MultiDogProfile = {
          id: "temp",
          name: dogProfile.name || "Your dog",
          ...dogProfile,
          weightUnit: dogProfile.weightUnit || "lb",
          ageUnit: dogProfile.ageUnit || "years",
        } as MultiDogProfile

        try {
          const recommendations = generateAIMealRecommendations([tempProfile])
          const rec = recommendations[0]

          if (rec.confidence >= 80) {
            message = `Looking good! I'm ${rec.confidence}% confident I can find the perfect recipe for ${dogProfile.name}. Keep adding details to refine my recommendations.`
          } else if (rec.confidence >= 60) {
            message = `I have some good ideas for ${dogProfile.name} (${rec.confidence}% confident). Add more details like breed or health goals to help me narrow down the best options.`
          } else {
            message = `I need a bit more information about ${dogProfile.name} to make strong recommendations. Try adding their breed, body condition, or health goals.`
          }
        } catch {
          message = `Building ${dogProfile.name}'s nutrition profile... Keep adding details for better recommendations!`
        }
      }

      setFeedback(message)
      setIsThinking(false)
    }, 300) // Short delay for "thinking" effect
  }, [dogProfile, feedbackType])

  // Debounce the feedback generation
  useEffect(() => {
    const timer = setTimeout(() => {
      generateFeedback()
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [generateFeedback, debounceMs])

  // Don't show if no relevant data
  if (!dogProfile.name) {
    return null
  }

  // Don't show for certain types if required data is missing
  if (feedbackType === "body-condition" && !dogProfile.bodyCondition) {
    return null
  }

  if (
    feedbackType === "weight-goal" &&
    (!dogProfile.healthGoals?.targetWeight || !dogProfile.weight)
  ) {
    return null
  }

  if (feedbackType === "activity" && !dogProfile.activity) {
    return null
  }

  return (
    <Card
      className={cn(
        "border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30",
        "transition-all duration-300",
        className
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <Sparkles className={cn("h-4 w-4 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0", isThinking && "animate-pulse")} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
              AI Insight
            </div>
            {isThinking ? (
              <AIThinking message="Analyzing..." className="text-xs" />
            ) : (
              <p className="text-sm text-blue-800 dark:text-blue-200">{feedback}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Simple real-time confidence indicator
 */
export function LiveConfidenceIndicator({ dogProfile }: { dogProfile: Partial<MultiDogProfile> }) {
  const [confidence, setConfidence] = useState(0)
  const [previousConfidence, setPreviousConfidence] = useState(0)

  useEffect(() => {
    if (!dogProfile.name) {
      setConfidence(0)
      return
    }

    const tempProfile: MultiDogProfile = {
      id: "temp",
      name: dogProfile.name,
      ...dogProfile,
      weightUnit: dogProfile.weightUnit || "lb",
      ageUnit: dogProfile.ageUnit || "years",
    } as MultiDogProfile

    try {
      const recommendations = generateAIMealRecommendations([tempProfile])
      const newConfidence = recommendations[0].confidence

      setPreviousConfidence(confidence)
      setConfidence(newConfidence)
    } catch {
      setConfidence(50)
    }
  }, [dogProfile])

  if (!dogProfile.name) {
    return null
  }

  const improvement = confidence - previousConfidence
  const showImprovement = improvement > 5 && previousConfidence > 0

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex items-center gap-1">
        <Sparkles className="h-4 w-4 text-blue-500 dark:text-blue-400" />
        <span className="text-muted-foreground">AI Confidence:</span>
        <span className="font-semibold">{confidence}%</span>
      </div>
      {showImprovement && (
        <span className="text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in slide-in-from-bottom-1 duration-300">
          +{improvement}%
        </span>
      )}
    </div>
  )
}
