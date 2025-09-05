import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Stethoscope, Shield, ArrowLeft, AlertTriangle } from "lucide-react"
import { prescriptionDiets, getMedicalConditionById } from "@/lib/prescription-diets"
import { NutritionalComplianceAnalyzer } from "@/components/medical/nutritional-compliance-analyzer"
import Link from "next/link"
import { notFound } from "next/navigation"

interface PrescriptionRecipePageProps {
  params: {
    id: string
  }
}

export default function PrescriptionRecipePage({ params }: PrescriptionRecipePageProps) {
  const diet = prescriptionDiets.find((d) => d.id === params.id)

  if (!diet) {
    notFound()
  }

  const condition = getMedicalConditionById(diet.conditionId)

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Back Navigation */}
      <Link href="/recipes/prescription">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Prescription Recipes
        </Button>
      </Link>

      {/* Recipe Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {diet.vetApproved && (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
              <Shield className="h-3 w-3 mr-1" />
              Vet Approved
            </Badge>
          )}
          {diet.prescriptionRequired && (
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
              <Stethoscope className="h-3 w-3 mr-1" />
              Prescription Required
            </Badge>
          )}
          <Badge variant="outline">{diet.availabilityStatus === "coming-soon" ? "Coming Soon" : "Available"}</Badge>
        </div>

        <h1 className="text-4xl font-bold">{diet.name}</h1>
        <p className="text-xl text-muted-foreground">{diet.description}</p>
      </div>

      {/* Medical Condition Info */}
      {condition && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle>Designed for {condition.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{condition.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold">Dietary Restrictions:</h4>
                <ul className="text-sm space-y-1">
                  {condition.dietaryRestrictions.map((restriction, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-red-500"></div>
                      Avoid {restriction}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Key Nutrients:</h4>
                <ul className="text-sm space-y-1">
                  {Object.entries(condition.requiredNutrients)
                    .slice(0, 3)
                    .map(([nutrient, req], index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-green-500"></div>
                        {nutrient}: {req.min && `min ${req.min}`}
                        {req.max && ` max ${req.max}`}
                        {req.target && ` target ${req.target}`}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Ingredients */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Ingredient Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {diet.ingredients.map((ingredient, index) => (
              <div key={index} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <h4 className="font-semibold">{ingredient.name}</h4>
                  <p className="text-sm text-muted-foreground">{ingredient.purpose}</p>
                </div>
                <Badge variant="secondary">{ingredient.percentage}%</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Nutritional Analysis */}
      <NutritionalComplianceAnalyzer diet={diet} conditionId={diet.conditionId} />

      {/* Prescription Warning */}
      {diet.prescriptionRequired && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">Veterinary Prescription Required</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  This therapeutic diet requires a prescription from a licensed veterinarian and ongoing medical
                  supervision. Please consult with your vet before starting this diet and follow their monitoring
                  recommendations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Call to Action */}
      <Card>
        <CardContent className="pt-6 text-center space-y-4">
          <h3 className="text-xl font-bold">Ready to Get Started?</h3>
          <p className="text-muted-foreground">
            Use our meal plan builder to create a personalized nutrition plan with this prescription diet.
          </p>
          <Link href="/plan-builder">
            <Button size="lg">
              Create Meal Plan
              <Stethoscope className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
