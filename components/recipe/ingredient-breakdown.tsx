import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, Truck } from "lucide-react"

interface Ingredient {
  name: string
  percentage: number
  source: string
  benefits: string[]
}

interface IngredientBreakdownProps {
  recipeId: string
}

// Mock ingredient data - in a real app this would come from an API
const ingredientData: Record<string, Ingredient[]> = {
  "beef-quinoa-harvest": [
    { name: "Lean ground beef", percentage: 50, source: "Mosner Family Brands", benefits: ["High-quality protein", "Iron", "B vitamins"] },
    { name: "Quinoa", percentage: 20, source: "Organic Supplier", benefits: ["Complete amino acids", "Digestive fiber"] },
    { name: "Carrots", percentage: 10, source: "Local Farms", benefits: ["Beta-carotene", "Eye health"] },
    { name: "Zucchini", percentage: 8, source: "Local Farms", benefits: ["Hydration", "Low-calorie fiber"] },
    { name: "Spinach", percentage: 8, source: "Local Farms", benefits: ["Iron", "Folate"] },
    { name: "Balance IT", percentage: 2, source: "Balance IT", benefits: ["Complete micronutrients"] },
    { name: "Fish oil", percentage: 2, source: "IFOS-certified", benefits: ["EPA/DHA for skin & coat"] },
  ],
  "lamb-pumpkin-feast": [
    { name: "Ground lamb", percentage: 50, source: "Mosner Family Brands", benefits: ["Highly bioavailable protein"] },
    { name: "Pumpkin purée", percentage: 15, source: "Organic", benefits: ["Digestive support", "Beta-carotene"] },
    { name: "Quinoa", percentage: 15, source: "Organic Supplier", benefits: ["Complete amino acids"] },
    { name: "Carrots", percentage: 8, source: "Local Farms", benefits: ["Antioxidants"] },
    { name: "Kale or spinach", percentage: 8, source: "Local Farms", benefits: ["Minerals & vitamins"] },
    { name: "Balance IT", percentage: 2, source: "Balance IT", benefits: ["Complete micronutrients"] },
    { name: "Fish oil", percentage: 2, source: "IFOS-certified", benefits: ["EPA/DHA for skin & coat"] },
  ],
  "low-fat-chicken-garden-veggie": [
    { name: "Skinless chicken breast", percentage: 48, source: "Sunrise Poultry", benefits: ["Lean protein for sensitive tummies"] },
    { name: "Egg whites", percentage: 10, source: "Certified", benefits: ["Additional lean protein"] },
    { name: "Quinoa", percentage: 18, source: "Organic", benefits: ["Complete amino acids"] },
    { name: "Carrots (with zucchini adjustment)", percentage: 10, source: "Local Farms", benefits: ["Digestive fiber; zucchini swap to lighten carrots"] },
    { name: "Spinach", percentage: 10, source: "Local Farms", benefits: ["Folate, iron"] },
    { name: "Balance IT", percentage: 2, source: "Balance IT", benefits: ["Complete micronutrients"] },
    { name: "Fish oil", percentage: 2, source: "IFOS-certified", benefits: ["EPA/DHA"] },
  ],
  "turkey-brown-rice-comfort": [
    { name: "Lean ground turkey", percentage: 50, source: "Mosner Family Brands", benefits: ["Lean protein"] },
    { name: "Brown rice", percentage: 18, source: "Organic", benefits: ["Complex carbs", "Steady energy"] },
    { name: "Carrots", percentage: 10, source: "Local Farms", benefits: ["Beta-carotene"] },
    { name: "Zucchini", percentage: 10, source: "Local Farms", benefits: ["Hydration", "Fiber"] },
    { name: "Spinach", percentage: 10, source: "Local Farms", benefits: ["Iron", "Vitamins"] },
    { name: "Balance IT", percentage: 1, source: "Balance IT", benefits: ["Complete micronutrients"] },
    { name: "Fish oil", percentage: 1, source: "IFOS-certified", benefits: ["EPA/DHA"] },
  ],
}

export function IngredientBreakdown({ recipeId }: IngredientBreakdownProps) {
  const ingredients = ingredientData[recipeId] || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Ingredient Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {ingredients.map((ingredient, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-lg font-semibold">{ingredient.name}</div>
                <Badge variant="secondary" className="font-bold">
                  {ingredient.percentage}%
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Truck className="h-3 w-3" />
                <span className="text-xs">{ingredient.source}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Nutritional Benefits:</div>
              <div className="flex flex-wrap gap-1">
                {ingredient.benefits.map((benefit, benefitIndex) => (
                  <Badge key={benefitIndex} variant="outline" className="text-xs">
                    {benefit}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ))}

        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Award className="h-4 w-4" />
            <span>All ingredients are USDA inspected and third-party tested for quality and safety</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
