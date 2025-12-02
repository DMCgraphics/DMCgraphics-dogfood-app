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
    { name: "Ground beef (90% lean)", percentage: 56, source: "Mosner Family Brands", benefits: ["High-quality protein", "Iron", "B vitamins"] },
    { name: "Quinoa", percentage: 17, source: "Organic Supplier", benefits: ["Complete amino acids", "Digestive fiber"] },
    { name: "Sweet potato", percentage: 9, source: "Local & Regional Farms", benefits: ["Complex carbs", "Beta-carotene"] },
    { name: "Beef broth", percentage: 7, source: "Mosner Family Brands", benefits: ["Flavor", "Hydration"] },
    { name: "Peas", percentage: 4, source: "Local & Regional Farms", benefits: ["Protein", "Fiber"] },
    { name: "Carrots", percentage: 4, source: "Local & Regional Farms", benefits: ["Beta-carotene", "Eye health"] },
    { name: "Custom Premix & supplements", percentage: 3, source: "NouriPet", benefits: ["Complete micronutrients", "Essential vitamins & minerals"] },
  ],
  "lamb-pumpkin-feast": [
    { name: "Ground lamb", percentage: 47, source: "Mosner Family Brands", benefits: ["Highly bioavailable protein", "Rich in zinc"] },
    { name: "Pumpkin", percentage: 15, source: "Local & Regional Farms", benefits: ["Digestive support", "Beta-carotene"] },
    { name: "Quinoa", percentage: 15, source: "Organic Supplier", benefits: ["Complete amino acids", "Fiber"] },
    { name: "Lamb broth", percentage: 9, source: "Mosner Family Brands", benefits: ["Flavor", "Hydration"] },
    { name: "Peas", percentage: 4, source: "Local & Regional Farms", benefits: ["Protein", "Fiber"] },
    { name: "Carrots", percentage: 4, source: "Local & Regional Farms", benefits: ["Beta-carotene", "Antioxidants"] },
    { name: "Custom Premix & supplements", percentage: 6, source: "NouriPet", benefits: ["Complete micronutrients", "Essential vitamins & minerals"] },
  ],
  "low-fat-chicken-garden-veggie": [
    { name: "Skinless chicken breast", percentage: 55, source: "Mosner Family Brands", benefits: ["Ultra-lean protein for sensitive digestion"] },
    { name: "Egg whites", percentage: 10, source: "Certified", benefits: ["High-quality, fat-free protein"] },
    { name: "Quinoa", percentage: 15, source: "Organic Supplier", benefits: ["Digestible carb, complete amino acids"] },
    { name: "Carrots (lightened with zucchini)", percentage: 8, source: "Local & Regional Farms", benefits: ["Fiber, beta-carotene"] },
    { name: "Spinach", percentage: 8, source: "Local & Regional Farms", benefits: ["Iron, folate"] },
    { name: "Custom Premix (Low Fat)", percentage: 3, source: "NouriPet", benefits: ["Essential vitamins/minerals for low-fat diets"] },
  ],
  "turkey-brown-rice-comfort": [
    { name: "Lean ground turkey", percentage: 50, source: "Mosner Family Brands", benefits: ["Lean protein"] },
    { name: "Brown rice", percentage: 18, source: "Organic", benefits: ["Complex carbs", "Steady energy"] },
    { name: "Carrots", percentage: 10, source: "Local & Regional Farms", benefits: ["Beta-carotene"] },
    { name: "Zucchini", percentage: 10, source: "Local & Regional Farms", benefits: ["Hydration", "Fiber"] },
    { name: "Spinach", percentage: 10, source: "Local & Regional Farms", benefits: ["Iron", "Vitamins"] },
    { name: "Custom Premix", percentage: 1, source: "NouriPet", benefits: ["Complete micronutrients"] },
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
            <span>AAFCO approved recipes lab tested for proper ingredient ratios. Nutrient premix tested for salmonella.</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
