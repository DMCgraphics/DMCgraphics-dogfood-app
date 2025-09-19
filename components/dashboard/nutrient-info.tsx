"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, Droplets, Leaf, Beef } from "lucide-react"

interface NutrientInfoProps {
  dogName: string
  recipeName?: string
  dailyCalories?: number
  protein?: number
  fat?: number
  carbs?: number
  fiber?: number
  moisture?: number
}

export function NutrientInfo({ 
  dogName, 
  recipeName = "No Recipe Selected",
  dailyCalories = 0,
  protein = 0,
  fat = 0,
  carbs = 0,
  fiber = 0,
  moisture = 0
}: NutrientInfoProps) {
  console.log(`[v0] NutrientInfo received:`, {
    dogName,
    recipeName,
    dailyCalories,
    protein,
    fat,
    carbs,
    fiber,
    moisture
  })
  const nutrients = [
    {
      name: "Protein",
      value: protein,
      unit: "%",
      icon: Beef,
      color: "text-red-500",
      bgColor: "bg-red-50",
      description: "Essential for muscle development"
    },
    {
      name: "Fat",
      value: fat,
      unit: "%",
      icon: Droplets,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
      description: "Energy and coat health"
    },
    {
      name: "Carbs",
      value: carbs,
      unit: "%",
      icon: Leaf,
      color: "text-green-500",
      bgColor: "bg-green-50",
      description: "Sustained energy"
    },
    {
      name: "Fiber",
      value: fiber,
      unit: "%",
      icon: Leaf,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
      description: "Digestive health"
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Daily Nutrition
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          {recipeName} for {dogName}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {dailyCalories > 0 && (
          <div className="text-center p-4 bg-primary/5 rounded-lg">
            <div className="text-2xl font-bold text-primary">{dailyCalories}</div>
            <div className="text-sm text-muted-foreground">Daily Calories</div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          {nutrients.map((nutrient) => {
            const Icon = nutrient.icon
            return (
              <div key={nutrient.name} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className={`p-2 rounded-full ${nutrient.bgColor}`}>
                  <Icon className={`h-4 w-4 ${nutrient.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{nutrient.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {nutrient.value}{nutrient.unit}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {nutrient.description}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {moisture > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Moisture Content</span>
              <Badge variant="outline">{moisture}%</Badge>
            </div>
          </div>
        )}
        
        {recipeName === "No Recipe Selected" && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Select a recipe to see nutritional information
          </div>
        )}
      </CardContent>
    </Card>
  )
}
