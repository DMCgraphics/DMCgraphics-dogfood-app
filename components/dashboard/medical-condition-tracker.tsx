"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Activity, TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react"

interface MedicalCondition {
  id: string
  name: string
  diagnosedDate: Date
  severity: "mild" | "moderate" | "severe"
  status: "stable" | "improving" | "worsening" | "monitoring"
  lastCheckup: Date
  nextCheckup?: Date
  medications: string[]
  dietaryRestrictions: string[]
  notes?: string
}

interface MedicalConditionTrackerProps {
  conditions: MedicalCondition[]
  onScheduleCheckup?: (conditionId: string) => void
  onUpdateCondition?: (conditionId: string) => void
}

export function MedicalConditionTracker({
  conditions,
  onScheduleCheckup,
  onUpdateCondition,
}: MedicalConditionTrackerProps) {
  if (conditions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Medical Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Heart className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Medical Conditions</h3>
            <p className="text-sm text-muted-foreground">
              Your dog doesn't have any tracked medical conditions. Great news!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "worsening":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case "stable":
        return <Minus className="h-4 w-4 text-blue-500" />
      case "monitoring":
        return <Activity className="h-4 w-4 text-amber-500" />
      default:
        return <Heart className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "improving":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      case "worsening":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
      case "stable":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
      case "monitoring":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "mild":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      case "moderate":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
      case "severe":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getCheckupStatus = (condition: MedicalCondition) => {
    if (!condition.nextCheckup) return null

    const now = new Date()
    const daysUntilCheckup = Math.ceil((condition.nextCheckup.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilCheckup < 0) {
      return { status: "overdue", message: "Checkup overdue", color: "text-red-600" }
    } else if (daysUntilCheckup <= 7) {
      return { status: "upcoming", message: `Checkup in ${daysUntilCheckup} days`, color: "text-amber-600" }
    } else {
      return {
        status: "scheduled",
        message: `Next checkup: ${condition.nextCheckup.toLocaleDateString()}`,
        color: "text-green-600",
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Medical Conditions ({conditions.length})
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {conditions.map((condition) => {
          const checkupStatus = getCheckupStatus(condition)

          return (
            <div key={condition.id} className="p-4 border rounded-lg space-y-3">
              {/* Condition Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className="font-semibold">{condition.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Diagnosed: {condition.diagnosedDate.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge className={getSeverityColor(condition.severity)}>{condition.severity}</Badge>
                  <Badge className={getStatusColor(condition.status)}>
                    {getStatusIcon(condition.status)}
                    <span className="ml-1 capitalize">{condition.status}</span>
                  </Badge>
                </div>
              </div>

              {/* Checkup Status */}
              {checkupStatus && (
                <div
                  className={`p-2 rounded text-sm ${
                    checkupStatus.status === "overdue"
                      ? "bg-red-50 dark:bg-red-950/20"
                      : checkupStatus.status === "upcoming"
                        ? "bg-amber-50 dark:bg-amber-950/20"
                        : "bg-green-50 dark:bg-green-950/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span className={checkupStatus.color}>{checkupStatus.message}</span>
                  </div>
                </div>
              )}

              {/* Dietary Restrictions */}
              {condition.dietaryRestrictions.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold">Dietary Restrictions:</h5>
                  <div className="flex flex-wrap gap-1">
                    {condition.dietaryRestrictions.map((restriction, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {restriction}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Medications */}
              {condition.medications.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold">Current Medications:</h5>
                  <div className="flex flex-wrap gap-1">
                    {condition.medications.map((medication, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {medication}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {condition.notes && (
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold">Notes:</h5>
                  <p className="text-sm text-muted-foreground">{condition.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {onScheduleCheckup && (
                  <Button variant="outline" size="sm" onClick={() => onScheduleCheckup(condition.id)}>
                    <Calendar className="h-3 w-3 mr-1" />
                    Schedule Checkup
                  </Button>
                )}
                {onUpdateCondition && (
                  <Button variant="outline" size="sm" onClick={() => onUpdateCondition(condition.id)}>
                    Update Status
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
