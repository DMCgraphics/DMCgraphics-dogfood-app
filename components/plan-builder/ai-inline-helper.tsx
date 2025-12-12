"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, X, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface AIInlineHelperProps {
  /**
   * Unique ID for this helper (for remembering dismissal)
   */
  id: string

  /**
   * The AI tip/guidance text to display
   */
  message: string

  /**
   * Optional: Show loading state
   */
  isLoading?: boolean

  /**
   * Optional: Start collapsed
   */
  defaultCollapsed?: boolean

  /**
   * Optional: Variant style
   */
  variant?: "default" | "info" | "warning" | "success"

  /**
   * Optional: Position hint
   */
  className?: string
}

const STORAGE_KEY_PREFIX = "ai-helper-dismissed-"

export function AIInlineHelper({
  id,
  message,
  isLoading = false,
  defaultCollapsed = false,
  variant = "default",
  className,
}: AIInlineHelperProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  // Check if this helper was previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`)
    if (dismissed === "true") {
      setIsDismissed(true)
    }
  }, [id])

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${id}`, "true")
  }

  // Don't render if dismissed
  if (isDismissed) {
    return null
  }

  const variantStyles = {
    default: {
      card: "border-blue-200 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/20 dark:to-indigo-950/20",
      icon: "text-blue-600 dark:text-blue-400",
      text: "text-blue-800 dark:text-blue-200",
    },
    info: {
      card: "border-sky-200 bg-gradient-to-r from-sky-50/80 to-cyan-50/80 dark:from-sky-950/20 dark:to-cyan-950/20",
      icon: "text-sky-600 dark:text-sky-400",
      text: "text-sky-800 dark:text-sky-200",
    },
    warning: {
      card: "border-amber-200 bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/20 dark:to-orange-950/20",
      icon: "text-amber-600 dark:text-amber-400",
      text: "text-amber-800 dark:text-amber-200",
    },
    success: {
      card: "border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/20 dark:to-teal-950/20",
      icon: "text-emerald-600 dark:text-emerald-400",
      text: "text-emerald-800 dark:text-emerald-200",
    },
  }

  const styles = variantStyles[variant]

  return (
    <Card className={cn("border shadow-sm transition-all duration-200", styles.card, className)}>
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          {/* AI Icon */}
          <div className={cn("mt-0.5 flex-shrink-0", styles.icon)}>
            {isLoading ? (
              <Sparkles className="h-4 w-4 animate-pulse" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                AI Tip
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Collapse/Expand Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="h-5 w-5 p-0 hover:bg-transparent"
                >
                  {isCollapsed ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronUp className="h-3 w-3" />
                  )}
                </Button>

                {/* Dismiss Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-5 w-5 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Message */}
            {!isCollapsed && (
              <div className={cn("text-sm leading-relaxed", styles.text)}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse">Thinking...</div>
                  </div>
                ) : (
                  message
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Preset helpers for common use cases
 */

export function BodyConditionHelper({ bodyCondition, dogName }: { bodyCondition: number; dogName: string }) {
  let message = ""

  if (bodyCondition <= 3) {
    message = `${dogName} appears underweight (${bodyCondition}/9). I'll recommend calorie-dense recipes with higher fat content to support healthy weight gain. This usually takes 2-3 months with the right nutrition.`
  } else if (bodyCondition >= 7) {
    message = `${dogName} appears overweight (${bodyCondition}/9). I'll suggest lower-fat recipes with higher fiber to help reach a healthy weight. Gradual weight loss of 1-2% per week is safest.`
  } else {
    message = `${dogName} has an ideal body condition (${bodyCondition}/9)! I'll recommend recipes that maintain this healthy weight while supporting their activity level.`
  }

  return (
    <AIInlineHelper
      id={`body-condition-${bodyCondition}`}
      message={message}
      variant={bodyCondition <= 3 || bodyCondition >= 7 ? "warning" : "success"}
    />
  )
}

export function WeightGoalHelper({
  dogName,
  currentWeight,
  targetWeight,
  weightUnit,
  goal,
}: {
  dogName: string
  currentWeight: number
  targetWeight: number
  weightUnit: string
  goal: "lose" | "gain" | "maintain"
}) {
  const difference = Math.abs(currentWeight - targetWeight)
  const percentChange = (difference / currentWeight) * 100

  let message = ""
  let variant: "default" | "info" | "warning" | "success" = "default"

  if (goal === "lose") {
    if (percentChange > 20) {
      message = `That's a significant weight loss goal for ${dogName} (${percentChange.toFixed(1)}%). I recommend consulting with your vet to ensure we approach this safely. Gradual change is healthiest!`
      variant = "warning"
    } else if (percentChange > 10) {
      message = `${dogName}'s weight loss goal looks achievable! Losing ${difference.toFixed(1)} ${weightUnit} will take about 3-4 months with the right nutrition plan. I'll find recipes that support this journey. 💪`
      variant = "success"
    } else {
      message = `Perfect! ${dogName}'s weight loss goal is realistic and healthy. We'll find a recipe that helps them reach ${targetWeight} ${weightUnit} safely.`
      variant = "success"
    }
  } else if (goal === "gain") {
    if (percentChange > 20) {
      message = `That's a substantial weight gain goal (${percentChange.toFixed(1)}%). Let's make sure this is healthy for ${dogName} - consider checking with your vet.`
      variant = "warning"
    } else {
      message = `${dogName}'s weight gain goal looks good! I'll recommend calorie-dense recipes with quality protein to support healthy weight gain to ${targetWeight} ${weightUnit}.`
      variant = "success"
    }
  } else {
    message = `Maintaining ${dogName}'s weight at ${targetWeight} ${weightUnit} is a great goal! I'll find balanced recipes that keep them at their healthy weight.`
    variant = "success"
  }

  return <AIInlineHelper id={`weight-goal-${goal}-${percentChange.toFixed(0)}`} message={message} variant={variant} />
}

export function AllergenImpactHelper({
  dogName,
  selectedAllergens,
  availableRecipes,
  totalRecipes,
}: {
  dogName: string
  selectedAllergens: string[]
  availableRecipes: number
  totalRecipes: number
}) {
  let message = ""
  let variant: "default" | "info" | "warning" | "success" = "default"

  if (availableRecipes === 0) {
    message = `I'm having trouble finding recipes that avoid all of ${dogName}'s allergens (${selectedAllergens.join(", ")}). Let's review the allergen list to make sure it's accurate.`
    variant = "warning"
  } else if (availableRecipes <= 2) {
    message = `${dogName} has ${availableRecipes} excellent recipe option(s) after filtering ${selectedAllergens.length} allergen(s). Each one is nutritionally complete and delicious!`
    variant = "info"
  } else {
    message = `Good news! ${dogName} still has ${availableRecipes} great recipes to choose from after avoiding ${selectedAllergens.join(", ")}. Quality over quantity! ✨`
    variant = "success"
  }

  return (
    <AIInlineHelper
      id={`allergen-impact-${selectedAllergens.length}-${availableRecipes}`}
      message={message}
      variant={variant}
    />
  )
}

export function ServingSizeHelper({
  dogName,
  dailyCalories,
  gramsPerDay,
  mealsPerDay,
}: {
  dogName: string
  dailyCalories: number
  gramsPerDay: number
  mealsPerDay: number
}) {
  const gramsPerMeal = gramsPerDay / mealsPerDay
  const cupsPerMeal = (gramsPerMeal / 240).toFixed(1) // Rough conversion: 1 cup ≈ 240g

  const message = `${dogName} needs ${dailyCalories} calories per day, which is about ${gramsPerMeal.toFixed(0)}g per meal (roughly ${cupsPerMeal} cups). I've calculated this based on their weight, activity level, and goals.`

  return <AIInlineHelper id={`serving-size-${dailyCalories}`} message={message} variant="info" />
}
