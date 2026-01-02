"use client"

import React from "react"
import { Sparkles, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MultiDogProfile } from "@/lib/multi-dog-types"

interface AIStepGuidanceProps {
  step: number
  dogProfile?: Partial<MultiDogProfile>
  className?: string
}

/**
 * Step-by-step AI guidance that appears above each step
 * Shows progress, encouragement, and what's coming next
 */
export function AIStepGuidance({ step, dogProfile, className }: AIStepGuidanceProps) {
  const dogName = dogProfile?.name || "your dog"

  const stepGuidance: Record<number, { message: string; emoji: string }> = {
    1: {
      message: `Let's build ${dogName}'s nutrition profile! I'll use this information to recommend the perfect recipe.`,
      emoji: "📝",
    },
    2: {
      message:
        dogProfile?.weight && dogProfile?.age
          ? `Great! ${dogName} is ${dogProfile.age} ${dogProfile.ageUnit} old and weighs ${dogProfile.weight} ${dogProfile.weightUnit}. Now let's set health goals and identify any sensitivities.`
          : `Now let's set health goals for ${dogName} and identify any food sensitivities. This helps me recommend recipes that support their specific needs.`,
      emoji: "🎯",
    },
    3: {
      message: `Based on everything you've told me about ${dogName}, here are my top recommendations! I've analyzed their age, activity level, weight goals, and preferences.`,
      emoji: "✨",
    },
    4: {
      message:
        dogProfile?.selectedRecipe
          ? `Perfect! Here's your complete plan for ${dogName}. Review the portions, pricing, and schedule before proceeding.`
          : `Let's review ${dogName}'s complete meal plan. You can adjust portions and see pricing details here.`,
      emoji: "📋",
    },
  }

  const guidance = stepGuidance[step] || {
    message: `Let's continue building ${dogName}'s perfect meal plan!`,
    emoji: "📝",
  }

  return (
    <div className={cn("mb-6 border-l-4 border-blue-500 dark:border-blue-400 rounded-r-lg relative overflow-hidden", className)}>
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 animate-gradient-x opacity-80 dark:opacity-60" />

      {/* Content */}
      <div className="relative p-4 pl-5">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">AI Guide</span>
            </div>
            <p className="text-sm text-blue-900/90 dark:text-blue-100/90 leading-relaxed">{guidance.message}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Progress breadcrumbs showing which steps are complete
 */
export function AIProgressBreadcrumbs({
  currentStep,
  completedSteps,
  className,
}: {
  currentStep: number
  completedSteps: number[]
  className?: string
}) {
  const steps = [
    { number: 1, label: "Dog Basics" },
    { number: 2, label: "Goals & Sensitivities" },
    { number: 3, label: "Meal Selection" },
    { number: 4, label: "Plan Preview" },
  ]

  const currentStepRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll to current step on mobile
  React.useEffect(() => {
    if (currentStepRef.current) {
      currentStepRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      })
    }
  }, [currentStep])

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.number)
        const isCurrent = currentStep === step.number
        const isUpcoming = step.number > currentStep

        return (
          <div
            key={step.number}
            className="flex items-center gap-2 flex-shrink-0"
            ref={isCurrent ? currentStepRef : null}
          >
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                isCompleted && "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
                isCurrent && "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-200 dark:ring-blue-700",
                isUpcoming && "bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400"
              )}
            >
              {isCompleted ? (
                <Check className="h-3 w-3 flex-shrink-0" />
              ) : (
                <span className="w-3 h-3 rounded-full border-2 border-current flex-shrink-0" />
              )}
              <span>{step.label}</span>
            </div>
            {index < steps.length - 1 && <div className="h-px w-4 bg-slate-200 dark:bg-slate-700 flex-shrink-0" />}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Compact AI encouragement message
 */
export function AIEncouragement({ dogProfile }: { dogProfile?: Partial<MultiDogProfile> }) {
  const dogName = dogProfile?.name || "your dog"

  // Calculate profile completeness
  const totalFields = 10
  const completedFields = [
    dogProfile?.name,
    dogProfile?.breed,
    dogProfile?.age,
    dogProfile?.weight,
    dogProfile?.activity,
    dogProfile?.bodyCondition,
    dogProfile?.healthGoals?.weightGoal,
    dogProfile?.sex,
    dogProfile?.isNeutered !== undefined,
    dogProfile?.selectedAllergens,
  ].filter(Boolean).length

  const completeness = Math.round((completedFields / totalFields) * 100)

  if (completeness === 100) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-600">
        <Check className="h-4 w-4" />
        <span className="font-medium">
          Perfect! I have everything I need to find {dogName}'s ideal recipe.
        </span>
      </div>
    )
  }

  if (completeness >= 70) {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-600">
        <Sparkles className="h-4 w-4" />
        <span>
          Great progress! {dogName}'s profile is {completeness}% complete.
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <Sparkles className="h-4 w-4 text-slate-400" />
      <span>
        Building {dogName}'s profile... ({completeness}% complete)
      </span>
    </div>
  )
}
