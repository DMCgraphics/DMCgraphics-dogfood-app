"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, TrendingUp, Heart, Zap, ArrowRight } from "lucide-react"

interface Recommendation {
  id: string
  type: "nutrition" | "health" | "portion" | "supplement"
  title: string
  description: string
  action: string
  priority: "high" | "medium" | "low"
  reason: string
}

interface RecommendationsProps {
  dogName: string
  recommendations: Recommendation[]
  onTakeAction: (recommendationId: string) => void
}

export function Recommendations({ dogName, recommendations, onTakeAction }: RecommendationsProps) {
  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "nutrition":
        return Heart
      case "health":
        return TrendingUp
      case "portion":
        return Zap
      case "supplement":
        return Lightbulb
      default:
        return Lightbulb
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500 text-white"
      case "medium":
        return "bg-orange-500 text-white"
      case "low":
        return "bg-blue-500 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "nutrition":
        return "text-primary"
      case "health":
        return "text-green-600"
      case "portion":
        return "text-blue-600"
      case "supplement":
        return "text-purple-600"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Personalized Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.length > 0 ? (
          <div className="space-y-4">
            {recommendations.map((rec) => {
              const Icon = getRecommendationIcon(rec.type)
              return (
                <div key={rec.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg bg-muted/30`}>
                        <Icon className={`h-4 w-4 ${getTypeColor(rec.type)}`} />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{rec.title}</h4>
                          <Badge className={getPriorityColor(rec.priority)} variant="secondary">
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Why:</span> {rec.reason}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onTakeAction(rec.id)}
                    className="w-full bg-transparent"
                  >
                    {rec.action}
                    <ArrowRight className="h-3 w-3 ml-2" />
                  </Button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div className="text-sm">No recommendations at this time</div>
            <div className="text-xs">Keep logging data to get personalized insights</div>
          </div>
        )}

        <div className="pt-4 border-t">
          <div className="text-xs text-muted-foreground text-center">
            Recommendations are based on {dogName}'s health data, feeding patterns, and veterinary guidelines
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
