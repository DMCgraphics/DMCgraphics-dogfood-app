"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { AIStepGuidance, AIProgressBreadcrumbs } from "./ai-step-guidance"
import { CompletionTimeBadge } from "./completion-time-badge"
import type { MultiDogProfile } from "@/lib/multi-dog-types"

interface WizardLayoutProps {
  currentStep: number
  totalSteps: number
  stepTitle: string
  stepDescription: string
  children: React.ReactNode
  onNext: () => void
  onPrevious: () => void
  canGoNext: boolean
  canGoPrevious: boolean
  nextLabel?: string
  isLoading?: boolean
  showNextButton?: boolean
  dogProfile?: Partial<MultiDogProfile>
  completedSteps?: number[]
}

export function WizardLayout({
  currentStep,
  totalSteps,
  stepTitle,
  stepDescription,
  children,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
  nextLabel = "Continue",
  isLoading = false,
  showNextButton = true,
  dogProfile,
  completedSteps = [],
}: WizardLayoutProps) {
  const getStepLabels = () => {
    return ["Dog Basics", "Goals & Sensitivities", "Meal Selection", "Plan Preview"]
  }

  const stepLabels = getStepLabels()

  const renderStepIndicator = () => {
    return (
      <div className="hidden md:flex items-center justify-between mb-6">
        {stepLabels.slice(0, Math.min(5, totalSteps)).map((label, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isCompleted = stepNumber < currentStep
          const isAccessible = stepNumber <= currentStep

          return (
            <div key={stepNumber} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : isActive
                        ? "bg-primary text-primary-foreground"
                        : isAccessible
                          ? "bg-muted text-muted-foreground border-2 border-muted-foreground"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {stepNumber}
                </div>
                <span
                  className={`text-xs mt-2 text-center max-w-20 ${
                    isActive ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
              {index < stepLabels.slice(0, Math.min(5, totalSteps)).length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 transition-colors ${
                    stepNumber < currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-4xl py-8">
        {/* AI Progress Breadcrumbs - only show after step 0 */}
        {dogProfile && currentStep > 0 && (
          <div className="mb-8">
            {/* Progress chips - scrollable on mobile, hidden scrollbar */}
            <div
              className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              <AIProgressBreadcrumbs
                currentStep={currentStep}
                completedSteps={completedSteps}
              />
            </div>
          </div>
        )}

        {/* Step Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <h1 className="font-manrope text-2xl lg:text-3xl font-bold">{stepTitle}</h1>
            <p className="text-muted-foreground">{stepDescription}</p>
          </div>
          {dogProfile && currentStep > 0 && (
            <div className="flex-shrink-0">
              <CompletionTimeBadge currentStep={currentStep} totalSteps={totalSteps} />
            </div>
          )}
        </div>

        {/* Step Content */}
        <div className="mb-8">{children}</div>
      </div>

      {/* Sticky Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-4xl py-4">
          <div className="flex items-center gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            {showNextButton && (
              <Button
                onClick={onNext}
                disabled={!canGoNext || isLoading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2"
              >
                <span className="hidden sm:inline">{nextLabel}</span>
                <span className="sm:hidden">Next</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
