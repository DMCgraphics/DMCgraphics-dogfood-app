export const dynamic = "force-dynamic"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Stethoscope, Shield, ArrowRight, Heart, Key as Kidney, Clover as Liver } from "lucide-react"
import { prescriptionDiets, medicalConditions } from "@/lib/prescription-diets"
import Link from "next/link"

export default function PrescriptionRecipesPage() {
  const getConditionIcon = (conditionId: string) => {
    switch (conditionId) {
      case "kidney-disease":
        return <Kidney className="h-5 w-5" />
      case "liver-disease":
        return <Liver className="h-5 w-5" />
      case "heart-disease":
        return <Heart className="h-5 w-5" />
      default:
        return <Stethoscope className="h-5 w-5" />
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Prescription Diet Recipes</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Veterinary-approved therapeutic nutrition designed for dogs with specific medical conditions. All prescription
          diets require veterinary approval and ongoing monitoring.
        </p>
      </div>

      {/* Medical Conditions Overview */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Medical Conditions We Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {medicalConditions.map((condition) => (
              <div
                key={condition.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-900 border"
              >
                <div className="text-blue-600 mt-1">{getConditionIcon(condition.id)}</div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm">{condition.name}</h3>
                  <p className="text-xs text-muted-foreground">{condition.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Prescription Diet Recipes */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Available Prescription Diets</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {prescriptionDiets.map((diet) => {
            const condition = medicalConditions.find((c) => c.id === diet.conditionId)

            return (
              <Card key={diet.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video relative bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <div className="text-4xl">🥘</div>
                      <div className="text-sm font-medium text-muted-foreground">Therapeutic Recipe</div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="absolute top-3 right-3 space-y-2">
                    {diet.vetApproved && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                        <Shield className="h-3 w-3 mr-1" />
                        Vet Approved
                      </Badge>
                    )}
                    {diet.prescriptionRequired && (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 block">
                        <Stethoscope className="h-3 w-3 mr-1" />
                        Prescription Required
                      </Badge>
                    )}
                  </div>
                </div>

                <CardHeader>
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-2">
                      {getConditionIcon(diet.conditionId)}
                      {diet.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{diet.description}</p>
                    {condition && (
                      <Badge variant="outline" className="w-fit">
                        For {condition.name}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Key Ingredients */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Key Ingredients:</h4>
                    <div className="space-y-1">
                      {diet.ingredients.slice(0, 3).map((ingredient, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{ingredient.name}</span>
                          <span className="text-muted-foreground">{ingredient.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Nutritional Profile */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Protein:</span>
                        <span className="font-medium">{diet.nutritionalProfile.protein}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fat:</span>
                        <span className="font-medium">{diet.nutritionalProfile.fat}%</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Fiber:</span>
                        <span className="font-medium">{diet.nutritionalProfile.fiber}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Calories:</span>
                        <span className="font-medium">{diet.nutritionalProfile.calories}/100g</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    <Link href={`/recipes/prescription/${diet.id}`}>
                      <Button className="w-full">
                        View Full Recipe Details
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Call to Action */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent className="pt-6 text-center space-y-4">
          <h3 className="text-xl font-bold">Need a Prescription Diet?</h3>
          <p className="text-muted-foreground">
            Start our meal plan builder to get personalized recommendations based on your dog's medical needs.
          </p>
          <Link href="/plan-builder">
            <Button size="lg">
              Start Meal Plan Builder
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
