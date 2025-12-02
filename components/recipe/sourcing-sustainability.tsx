"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Leaf, Award, FileText, ExternalLink } from "lucide-react"

interface SourcingSustainabilityProps {
  recipe: {
    id: string
    name: string
    sourcing: string[]
    sustainabilityScore: number
  }
}

export function SourcingSustainability({ recipe }: SourcingSustainabilityProps) {
  const handleCOAClick = () => {
    // Mock COA functionality - would open a PDF or detailed report
    alert(
      `Certificate of Analysis for ${recipe.name} - Batch #NR-2024-${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`,
    )
  }

  const sustainabilityFeatures = [
    {
      icon: Leaf,
      title: "Carbon Neutral Shipping",
      description: "All deliveries offset through verified carbon credits",
    },
    {
      icon: Award,
      title: "Regenerative Farming",
      description: "Partners practice soil-building agriculture",
    },
    {
      icon: MapPin,
      title: "Local Sourcing",
      description: "Ingredients sourced within 500 miles when possible",
    },
  ]

  const getSustainabilityGrade = (score: number) => {
    if (score >= 90) return { grade: "A+", color: "text-green-600", bg: "bg-green-50" }
    if (score >= 80) return { grade: "A", color: "text-green-600", bg: "bg-green-50" }
    if (score >= 70) return { grade: "B", color: "text-blue-600", bg: "bg-blue-50" }
    if (score >= 60) return { grade: "C", color: "text-yellow-600", bg: "bg-yellow-50" }
    return { grade: "D", color: "text-red-600", bg: "bg-red-50" }
  }

  const sustainabilityGrade = getSustainabilityGrade(recipe.sustainabilityScore)

  return (
    <div className="space-y-6">
      {/* Sourcing Partners */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Farm-to-Bowl Sourcing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {recipe.sourcing.map((source, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="font-medium">{source}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Verified Partner
                </Badge>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <Button onClick={handleCOAClick} variant="outline" className="w-full bg-transparent">
              <FileText className="h-4 w-4 mr-2" />
              View Certificate of Analysis (COA)
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              AAFCO approved recipes lab tested for proper ingredient ratios. Nutrient premix tested for salmonella.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sustainability Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5" />
            Sustainability Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${sustainabilityGrade.bg} mb-4`}
            >
              <span className={`text-2xl font-bold ${sustainabilityGrade.color}`}>{sustainabilityGrade.grade}</span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold">{recipe.sustainabilityScore}/100</div>
              <div className="text-sm text-muted-foreground">Environmental Impact Score</div>
            </div>
          </div>

          <div className="space-y-4">
            {sustainabilityFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <feature.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="font-medium text-sm">{feature.title}</div>
                  <div className="text-xs text-muted-foreground">{feature.description}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-primary/5 rounded-lg">
            <div className="text-sm">
              <div className="font-semibold mb-2">How we calculate sustainability:</div>
              <ul className="space-y-1 text-muted-foreground text-xs">
                <li>• Carbon footprint of ingredients and transportation</li>
                <li>• Farming practices and soil health impact</li>
                <li>• Packaging recyclability and waste reduction</li>
                <li>• Water usage and conservation efforts</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
