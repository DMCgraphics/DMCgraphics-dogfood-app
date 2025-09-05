"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, Info, Stethoscope } from "lucide-react"
import { generateMedicalNutritionalReport } from "@/lib/medical-nutrition-profiles"
import type { Recipe } from "@/lib/nutrition-calculator"
import type { PrescriptionDiet } from "@/lib/prescription-diets"

interface NutritionalComplianceAnalyzerProps {
  diet: Recipe | PrescriptionDiet
  conditionId: string
  showEducationalContent?: boolean
}

export function NutritionalComplianceAnalyzer({
  diet,
  conditionId,
  showEducationalContent = true,
}: NutritionalComplianceAnalyzerProps) {
  const report = generateMedicalNutritionalReport(diet, conditionId)
  const { profile, compliance, recommendations, educationalContent } = report

  const getStatusIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "moderate":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case "minor":
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  const getStatusColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
      case "moderate":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
      case "minor":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
    }
  }

  return (
    <div className="space-y-6">
      {/* Compliance Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Medical Nutritional Compliance
            </CardTitle>
            <Badge className={compliance.compliant ? getStatusColor("minor") : getStatusColor("critical")}>
              {compliance.compliant ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Compliant
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Non-Compliant
                </>
              )}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Compliance Score */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Compliance Score</span>
              <span className="font-semibold">{compliance.score}/100</span>
            </div>
            <Progress value={compliance.score} className="h-2" />
            <p className="text-xs text-muted-foreground">Based on {profile.conditionName} nutritional requirements</p>
          </div>

          {/* Diet Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
            <div>
              <h4 className="font-semibold text-sm">Diet</h4>
              <p className="text-sm text-muted-foreground">{diet.name}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm">Medical Condition</h4>
              <p className="text-sm text-muted-foreground">{profile.conditionName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Violations */}
      {compliance.violations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nutritional Violations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {compliance.violations.map((violation, index) => (
              <Alert key={index} className="border-l-4 border-l-red-500">
                <div className="flex items-start gap-3">
                  {getStatusIcon(violation.severity)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold capitalize">{violation.nutrient}</h4>
                      <Badge className={getStatusColor(violation.severity)}>{violation.severity}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>
                        Actual: {violation.actual}% {violation.required.min && `(Min: ${violation.required.min}%)`}{" "}
                        {violation.required.max && `(Max: ${violation.required.max}%)`}
                      </p>
                    </div>
                    <AlertDescription className="text-sm">{violation.recommendation}</AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {compliance.warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nutritional Warnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {compliance.warnings.map((warning, index) => (
              <Alert key={index} className="border-l-4 border-l-amber-500">
                <AlertTriangle className="h-4 w-4" />
                <div className="space-y-1">
                  <h4 className="font-semibold capitalize">{warning.nutrient}</h4>
                  <AlertDescription>{warning.message}</AlertDescription>
                  <p className="text-sm text-muted-foreground">{warning.recommendation}</p>
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Educational Content */}
      {showEducationalContent && educationalContent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Understanding {profile.conditionName} Nutrition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {educationalContent.map((content, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>{content}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Critical Nutrients Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Nutrients to Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">Critical Nutrients</h4>
              <div className="space-y-1">
                {profile.criticalNutrients.map((nutrient, index) => (
                  <Badge key={index} variant="destructive" className="mr-1 mb-1">
                    {nutrient}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">Restricted</h4>
              <div className="space-y-1">
                {profile.restrictedNutrients.map((nutrient, index) => (
                  <Badge key={index} variant="secondary" className="mr-1 mb-1">
                    {nutrient}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">Recommended</h4>
              <div className="space-y-1">
                {profile.recommendedNutrients.map((nutrient, index) => (
                  <Badge key={index} variant="outline" className="mr-1 mb-1">
                    {nutrient}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
