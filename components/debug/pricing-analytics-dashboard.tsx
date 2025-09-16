"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, Activity } from "lucide-react"
import { analytics, checkPricingViolationRate } from "@/lib/analytics"
import { useState, useEffect } from "react"

export function PricingAnalyticsDashboard() {
  const [violationRate, setViolationRate] = useState({ rate: 0, total: 0, violations: 0 })
  const [recentViolations, setRecentViolations] = useState<any[]>([])

  useEffect(() => {
    const updateStats = () => {
      setViolationRate(checkPricingViolationRate())
      setRecentViolations(analytics.getRecentPricingViolations(24))
    }

    updateStats()
    const interval = setInterval(updateStats, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const clearAnalytics = () => {
    localStorage.removeItem("nouripet_analytics")
    setViolationRate({ rate: 0, total: 0, violations: 0 })
    setRecentViolations([])
  }

  const violationPercentage = (violationRate.rate * 100).toFixed(1)
  const isHealthy = violationRate.rate < 0.005 // Less than 0.5%

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Pricing Analytics Dashboard
            <Badge variant={isHealthy ? "default" : "destructive"}>{isHealthy ? "Healthy" : "Alert"}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{violationRate.total}</div>
              <div className="text-sm text-muted-foreground">Meals/day changes (24h)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{violationRate.violations}</div>
              <div className="text-sm text-muted-foreground">Price violations (24h)</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${isHealthy ? "text-green-600" : "text-red-600"}`}>
                {violationPercentage}%
              </div>
              <div className="text-sm text-muted-foreground">Violation rate</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
            {isHealthy ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm">
              {isHealthy
                ? "Pricing invariance is working correctly. Violation rate is below 0.5% threshold."
                : `WARNING: Violation rate of ${violationPercentage}% exceeds 0.5% threshold. Investigation required.`}
            </span>
          </div>

          <Button onClick={clearAnalytics} variant="outline" size="sm">
            Clear Analytics Data
          </Button>
        </CardContent>
      </Card>

      {recentViolations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Recent Pricing Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentViolations.slice(0, 5).map((violation, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="destructive">Violation #{index + 1}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(violation.properties.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>Old Cost: ${violation.properties.oldCost?.toFixed(2)}</div>
                    <div>New Cost: ${violation.properties.newCost?.toFixed(2)}</div>
                    <div>Difference: ${violation.properties.diff?.toFixed(4)}</div>
                    <div>Meals/Day: {violation.properties.mealsPerDay}</div>
                    <div>Recipes: {violation.properties.recipeIds?.join(", ") || "Unknown"}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
