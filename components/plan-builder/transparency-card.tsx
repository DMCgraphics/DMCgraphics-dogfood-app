"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, AlertCircle, HelpCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DogProfile, HealthGoals } from "@/lib/nutrition-calculator"

interface TransparencyCardProps {
  dogProfile: Partial<DogProfile>
  healthGoals?: Partial<HealthGoals>
  selectedAllergens?: string[]
  className?: string
}

interface DataPoint {
  label: string
  value: string | number | boolean | undefined | null
  status: "provided" | "missing" | "optional"
  impact: "high" | "medium" | "low"
  description: string
}

export function TransparencyCard({
  dogProfile,
  healthGoals,
  selectedAllergens = [],
  className,
}: TransparencyCardProps) {
  const dogName = dogProfile.name || "your dog"

  // Define all data points we use for recommendations
  const dataPoints: DataPoint[] = [
    {
      label: "Dog's Name",
      value: dogProfile.name,
      status: dogProfile.name ? "provided" : "optional",
      impact: "low",
      description: "Used for personalization",
    },
    {
      label: "Age",
      value: dogProfile.age ? `${dogProfile.age} ${dogProfile.ageUnit}` : undefined,
      status: dogProfile.age ? "provided" : "missing",
      impact: "high",
      description: "Critical for life-stage nutrition requirements",
    },
    {
      label: "Weight",
      value: dogProfile.weight ? `${dogProfile.weight} ${dogProfile.weightUnit}` : undefined,
      status: dogProfile.weight ? "provided" : "missing",
      impact: "high",
      description: "Essential for portion sizing and calorie calculations",
    },
    {
      label: "Breed",
      value: dogProfile.breed,
      status: dogProfile.breed ? "provided" : "missing",
      impact: "medium",
      description: "Helps identify breed-specific nutritional needs",
    },
    {
      label: "Activity Level",
      value: dogProfile.activity,
      status: dogProfile.activity ? "provided" : "missing",
      impact: "high",
      description: "Determines daily energy requirements",
    },
    {
      label: "Body Condition",
      value: dogProfile.bodyCondition ? `${dogProfile.bodyCondition}/9` : undefined,
      status: dogProfile.bodyCondition ? "provided" : "missing",
      impact: "medium",
      description: "Helps refine portion recommendations",
    },
    {
      label: "Spay/Neuter Status",
      value: dogProfile.isNeutered !== undefined ? (dogProfile.isNeutered ? "Yes" : "No") : undefined,
      status: dogProfile.isNeutered !== undefined ? "provided" : "optional",
      impact: "low",
      description: "Affects metabolic rate calculations",
    },
    {
      label: "Health Goals",
      value: healthGoals?.weightManagement || healthGoals?.skinCoat || healthGoals?.joints || healthGoals?.digestiveHealth
        ? "Set"
        : undefined,
      status: healthGoals?.weightManagement || healthGoals?.skinCoat || healthGoals?.joints || healthGoals?.digestiveHealth
        ? "provided"
        : "optional",
      impact: "medium",
      description: "Guides recipe selection for specific health needs",
    },
    {
      label: "Food Sensitivities",
      value: selectedAllergens.length > 0 ? `${selectedAllergens.length} allergen(s)` : undefined,
      status: selectedAllergens.length > 0 ? "provided" : "optional",
      impact: "high",
      description: "Filters out unsafe ingredients",
    },
  ]

  const providedData = dataPoints.filter((d) => d.status === "provided")
  const missingData = dataPoints.filter((d) => d.status === "missing")
  const optionalData = dataPoints.filter((d) => d.status === "optional")

  const completeness = Math.round((providedData.length / dataPoints.length) * 100)

  const getStatusIcon = (status: string) => {
    if (status === "provided") return <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
    if (status === "missing") return <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
    return <HelpCircle className="h-4 w-4 text-slate-400 dark:text-slate-500" />
  }

  const getImpactBadge = (impact: string) => {
    const variants: Record<string, { bg: string; text: string }> = {
      high: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
      medium: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
      low: { bg: "bg-slate-100 dark:bg-slate-800/30", text: "text-slate-600 dark:text-slate-400" },
    }
    const variant = variants[impact]
    return (
      <Badge variant="outline" className={`text-xs ${variant.bg} ${variant.text} border-0`}>
        {impact} impact
      </Badge>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          What We Know About {dogName}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Our AI uses this information to find the best recipe match. More data = better recommendations.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Completeness Progress */}
        <div className="p-4 bg-muted/50 dark:bg-muted/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Profile Completeness</span>
            <span className="text-2xl font-bold text-primary">{completeness}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
              style={{ width: `${completeness}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {completeness >= 80
              ? "Excellent! We have plenty of data for accurate recommendations."
              : completeness >= 60
                ? "Good progress! Adding more details will improve accuracy."
                : "Add more information for better personalized recommendations."}
          </p>
        </div>

        {/* Data We're Using */}
        {providedData.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Check className="h-4 w-4" />
              Data We're Using ({providedData.length})
            </h4>
            <div className="space-y-2">
              {providedData.map((point, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg"
                >
                  {getStatusIcon(point.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{point.label}</span>
                      <span className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold">
                        {point.value}
                      </span>
                      {getImpactBadge(point.impact)}
                    </div>
                    <p className="text-xs text-muted-foreground">{point.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing Data */}
        {missingData.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Missing Data ({missingData.length})
            </h4>
            <div className="space-y-2">
              {missingData.map((point, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg"
                >
                  {getStatusIcon(point.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{point.label}</span>
                      {getImpactBadge(point.impact)}
                    </div>
                    <p className="text-xs text-muted-foreground">{point.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
              💡 <strong>Tip:</strong> Go back and add this information to improve recommendation accuracy by up to 25%.
            </p>
          </div>
        )}

        {/* Learn More */}
        <div className="pt-4 border-t">
          <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground hover:text-primary">
            Learn about our AI recommendation system →
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
