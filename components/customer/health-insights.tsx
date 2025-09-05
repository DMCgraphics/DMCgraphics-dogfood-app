"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { TrendingUp, TrendingDown, Heart, Activity, Scale, Download, Share } from "lucide-react"

interface HealthMetric {
  name: string
  value: number
  unit: string
  trend: "up" | "down" | "stable"
  status: "good" | "warning" | "attention"
  target?: number
}

export function HealthInsights() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">("month")

  const healthMetrics: HealthMetric[] = [
    {
      name: "Weight",
      value: 65,
      unit: "lbs",
      trend: "down",
      status: "good",
      target: 63,
    },
    {
      name: "Body Condition",
      value: 6,
      unit: "/9",
      trend: "stable",
      status: "good",
    },
    {
      name: "Activity Level",
      value: 85,
      unit: "%",
      trend: "up",
      status: "good",
    },
    {
      name: "Stool Quality",
      value: 4,
      unit: "/5",
      trend: "stable",
      status: "good",
    },
  ]

  const weightData = [
    { date: "Nov 1", weight: 67 },
    { date: "Nov 8", weight: 66.5 },
    { date: "Nov 15", weight: 66 },
    { date: "Nov 22", weight: 65.5 },
    { date: "Nov 29", weight: 65 },
    { date: "Dec 6", weight: 65 },
  ]

  const nutritionData = [
    { nutrient: "Protein", current: 28, target: 25 },
    { nutrient: "Fat", current: 15, target: 12 },
    { nutrient: "Carbs", current: 35, target: 40 },
    { nutrient: "Fiber", current: 8, target: 6 },
  ]

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-blue-500" />
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      case "warning":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
      case "attention":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
    }
  }

  const handleExportReport = () => {
    console.log("[v0] health_report_exported")
    alert("Health report exported! Check your downloads folder.")
  }

  const handleShareInsights = () => {
    console.log("[v0] health_insights_shared")
    alert("Health insights shared with your veterinarian!")
  }

  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Health Overview
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportReport}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" size="sm" onClick={handleShareInsights}>
                <Share className="h-4 w-4 mr-2" />
                Share with Vet
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {healthMetrics.map((metric) => (
              <Card key={metric.name}>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{metric.name}</span>
                      {getTrendIcon(metric.trend)}
                    </div>
                    <div className="text-2xl font-bold">
                      {metric.value}
                      <span className="text-sm font-normal text-muted-foreground">{metric.unit}</span>
                    </div>
                    {metric.target && (
                      <div className="text-xs text-muted-foreground">
                        Target: {metric.target}
                        {metric.unit}
                      </div>
                    )}
                    <Badge className={getStatusColor(metric.status)} variant="secondary">
                      {metric.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weight Tracking Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Weight Progress
            </CardTitle>
            <div className="flex gap-1">
              {(["week", "month", "quarter"] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range === "week" ? "7D" : range === "month" ? "30D" : "90D"}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm font-medium">Great progress!</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Max has lost 2 lbs this month, moving closer to his target weight of 63 lbs.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Nutrition Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Nutrition Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nutritionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nutrient" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="current" fill="hsl(var(--primary))" name="Current" />
                <Bar dataKey="target" fill="hsl(var(--muted))" name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {nutritionData.map((item) => (
              <div key={item.nutrient} className="flex items-center justify-between text-sm">
                <span>{item.nutrient}</span>
                <div className="flex items-center gap-2">
                  <span>{item.current}%</span>
                  <div className="w-20">
                    <Progress value={(item.current / item.target) * 100} className="h-2" />
                  </div>
                  <span className="text-muted-foreground">Target: {item.target}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Personalized Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Weight Management</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Continue current portion sizes. Max is on track to reach his target weight in 4-6 weeks.
            </p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Activity Level</h4>
            <p className="text-sm text-green-800 dark:text-green-200">
              Great activity levels! Consider adding joint support supplements for long-term health.
            </p>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Nutrition</h4>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Consider rotating to our Turkey & Pumpkin recipe next month for variety and different nutrients.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
