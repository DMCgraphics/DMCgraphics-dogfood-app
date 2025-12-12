"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Check, AlertCircle, TrendingUp, TrendingDown } from "lucide-react"
import type { ConfidenceBreakdown } from "@/lib/multi-dog-types"

interface ConfidenceExplanationModalProps {
  isOpen: boolean
  onClose: () => void
  confidence: number
  confidenceBreakdown?: ConfidenceBreakdown
  dogName?: string
}

export function ConfidenceExplanationModal({
  isOpen,
  onClose,
  confidence,
  confidenceBreakdown,
  dogName = "your dog",
}: ConfidenceExplanationModalProps) {
  const getConfidenceLevel = (score: number) => {
    if (score >= 85) return { label: "Very High", color: "emerald", description: "Excellent match based on comprehensive profile data" }
    if (score >= 70) return { label: "High", color: "blue", description: "Strong match with good profile information" }
    if (score >= 55) return { label: "Moderate", color: "amber", description: "Good recommendation, but more data could help refine" }
    return { label: "Needs More Info", color: "slate", description: "Limited data available - add more details for better recommendations" }
  }

  const level = getConfidenceLevel(confidence)

  // Get color classes based on confidence level
  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      emerald: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-300 dark:border-emerald-700" },
      blue: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", border: "border-blue-300 dark:border-blue-700" },
      amber: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", border: "border-amber-300 dark:border-amber-700" },
      slate: { bg: "bg-slate-100 dark:bg-slate-800/30", text: "text-slate-700 dark:text-slate-300", border: "border-slate-300 dark:border-slate-700" },
    }
    return colors[color] || colors.slate
  }

  const colorClasses = getColorClasses(level.color)

  // Sort adjustments by impact (highest first)
  const sortedAdjustments = confidenceBreakdown?.adjustments
    ? [...confidenceBreakdown.adjustments].sort((a, b) => Math.abs(b.points) - Math.abs(a.points))
    : []

  const getImpactIcon = (impact: string) => {
    if (impact === "high") return <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
    if (impact === "medium") return <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    return <TrendingDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>How We Calculated This Recommendation</span>
            <Badge className={`${colorClasses.bg} ${colorClasses.text} border ${colorClasses.border}`}>
              {confidence}% {level.label}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Here's exactly how we analyzed {dogName}'s profile to find the best recipe match.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Confidence Level Explanation */}
          <div className={`p-4 rounded-lg border ${colorClasses.bg} ${colorClasses.border}`}>
            <div className="flex items-start gap-3">
              <Check className={`h-5 w-5 mt-0.5 ${colorClasses.text}`} />
              <div>
                <h4 className={`font-semibold ${colorClasses.text}`}>{level.label} Confidence</h4>
                <p className="text-sm text-muted-foreground mt-1">{level.description}</p>
              </div>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Confidence Score</span>
              <span className="font-bold">{confidence}%</span>
            </div>
            <Progress value={confidence} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0% - Needs More Info</span>
              <span>100% - Perfect Match</span>
            </div>
          </div>

          {/* Scoring Breakdown */}
          {confidenceBreakdown && (
            <div className="space-y-4">
              <h4 className="font-semibold">What We Analyzed</h4>

              {/* Base Score */}
              <div className="p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Starting Base Score</span>
                  <span className="text-sm font-bold text-primary">{confidenceBreakdown.baseScore}%</span>
                </div>
              </div>

              {/* Factor Adjustments */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground">Factors That Influenced The Score:</h5>
                {sortedAdjustments.map((adjustment, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-background dark:bg-muted/10 border border-border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getImpactIcon(adjustment.impact)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-medium capitalize">{adjustment.factor}</span>
                        <span className={`text-sm font-bold ${adjustment.points >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                          {adjustment.points >= 0 ? "+" : ""}{adjustment.points} pts
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{adjustment.description}</p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {adjustment.impact} impact
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Score */}
              <div className="p-4 bg-primary/10 dark:bg-primary/20 border-2 border-primary rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Final Confidence Score</span>
                  <span className="text-xl font-bold text-primary">{confidenceBreakdown.totalScore}%</span>
                </div>
              </div>
            </div>
          )}

          {/* How to Improve */}
          {confidence < 85 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                💡 How to Improve This Score
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Add more details about {dogName}'s breed and activity level</li>
                <li>• Specify any health goals or medical conditions</li>
                <li>• Include information about food sensitivities</li>
                <li>• Update body condition score for more accurate portions</li>
              </ul>
            </div>
          )}

          {/* Trust Message */}
          <div className="text-xs text-center text-muted-foreground border-t pt-4">
            Our AI analyzes {dogName}'s unique profile using veterinary nutrition science.
            All recommendations are reviewed for safety and nutritional completeness.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
