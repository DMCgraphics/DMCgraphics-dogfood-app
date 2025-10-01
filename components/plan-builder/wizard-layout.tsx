"use client"

import type React from "react"

import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"

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
}: WizardLayoutProps) {
  const progress = (currentStep / totalSteps) * 100

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
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        {/* Progress Header */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Step {currentStep} of {totalSteps}
            </span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-3" />

          {renderStepIndicator()}

          <div className="space-y-2">
            <h1 className="font-manrope text-2xl lg:text-3xl font-bold">{stepTitle}</h1>
            <p className="text-muted-foreground">{stepDescription}</p>
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">{children}</div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className="flex items-center gap-2 bg-transparent"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          {showNextButton && (
            <Button onClick={onNext} disabled={!canGoNext || isLoading} className="flex items-center gap-2">
              {nextLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
