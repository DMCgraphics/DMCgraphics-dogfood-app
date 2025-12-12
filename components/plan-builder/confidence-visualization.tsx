"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronDown, ChevronUp, Info, TrendingUp, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { calculateConfidence, getProgressBarColors } from "@/lib/ai/confidence-calculator"
import type { ConfidenceBreakdown, ScoringFactor } from "@/lib/multi-dog-types"
import { ConfidenceExplanationModal } from "./confidence-explanation-modal"

interface ConfidenceVisualizationProps {
  confidence: number
  confidenceBreakdown?: ConfidenceBreakdown
  factorsConsidered?: ScoringFactor[]
  className?: string
  dogName?: string
}

export function ConfidenceVisualization({
  confidence,
  confidenceBreakdown,
  factorsConsidered = [],
  className,
  dogName,
}: ConfidenceVisualizationProps) {
  const [showAllFactors, setShowAllFactors] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const result = calculateConfidence(confidence)
  const colors = getProgressBarColors(result.level)

  // Group factors by category
  const factorsByCategory = factorsConsidered.reduce(
    (acc, factor) => {
      if (!acc[factor.category]) {
        acc[factor.category] = []
      }
      acc[factor.category].push(factor)
      return acc
    },
    {} as Record<string, ScoringFactor[]>
  )

  const categoryLabels: Record<string, string> = {
    age: "Age-Based",
    activity: "Activity Level",
    weight: "Weight Management",
    health: "Health Goals",
    breed: "Breed-Specific",
    allergens: "Allergen Filtering",
    portions: "Portion Optimization",
  }

  const categoryIcons: Record<string, string> = {
    age: "🎂",
    activity: "⚡",
    weight: "⚖️",
    health: "❤️",
    breed: "🐕",
    allergens: "🚫",
    portions: "🍽️",
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Confidence Display */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">Match Confidence</div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold">{confidence}%</span>
            <Badge
              className={cn(result.bgColor, result.textColor, "border-0", confidenceBreakdown && "cursor-pointer hover:opacity-80 transition-opacity")}
              onClick={() => confidenceBreakdown && setShowModal(true)}
            >
              {result.emoji} {result.label}
            </Badge>
          </div>
        </div>

        {/* Detailed Breakdown Button */}
        {confidenceBreakdown && (
          <Button variant="outline" size="sm" onClick={() => setShowModal(true)}>
            <Info className="h-4 w-4 mr-2" />
            Details
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className={cn("h-3 rounded-full transition-all duration-500", colors.filled)}
            style={{ width: `${confidence}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{result.description}</p>
      </div>

      {/* Top Contributing Factors (Compact View) */}
      {confidenceBreakdown && confidenceBreakdown.adjustments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Contributing Factors
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllFactors(!showAllFactors)}
              className="h-auto py-1 text-xs"
            >
              {showAllFactors ? (
                <>
                  Show Less <ChevronUp className="h-3 w-3 ml-1" />
                </>
              ) : (
                <>
                  Show All ({confidenceBreakdown.adjustments.length}) <ChevronDown className="h-3 w-3 ml-1" />
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            {confidenceBreakdown.adjustments
              .slice(0, showAllFactors ? undefined : 3)
              .map((adj, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{adj.factor}</span>
                      <Badge
                        variant={
                          adj.impact === "high" ? "default" : adj.impact === "medium" ? "secondary" : "outline"
                        }
                        className="text-xs"
                      >
                        +{adj.points}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{adj.description}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Confidence Explanation Modal */}
      <ConfidenceExplanationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        confidence={confidence}
        confidenceBreakdown={confidenceBreakdown}
        dogName={dogName}
      />
    </div>
  )
}

/**
 * Compact version for inline use
 */
export function ConfidenceBadge({ confidence, className }: { confidence: number; className?: string }) {
  const result = calculateConfidence(confidence)

  return (
    <Badge className={cn(result.bgColor, result.textColor, "border-0", className)}>
      {result.emoji} {confidence}% {result.label}
    </Badge>
  )
}

/**
 * Simple progress bar for inline use
 */
export function ConfidenceProgressBar({ confidence, className }: { confidence: number; className?: string }) {
  const result = calculateConfidence(confidence)
  const colors = getProgressBarColors(result.level)

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Confidence</span>
        <span className="font-medium">{confidence}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div className={cn("h-2 rounded-full transition-all", colors.filled)} style={{ width: `${confidence}%` }} />
      </div>
    </div>
  )
}
