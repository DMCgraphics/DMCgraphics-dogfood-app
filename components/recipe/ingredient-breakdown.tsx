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
    { name: "Beef heart", percentage: 7, source: "Mosner Family Brands", benefits: ["Taurine", "CoQ10", "B vitamins"] },
    { name: "Beef liver", percentage: 5, source: "Mosner Family Brands", benefits: ["Vitamin A", "Iron", "B12"] },
    { name: "Whole egg", percentage: 4, source: "Mosner Family Brands", benefits: ["Complete protein", "Biotin", "Choline"] },
    { name: "Quinoa", percentage: 17, source: "Local CT & NY farms", benefits: ["Complete amino acids", "Digestive fiber"] },
    { name: "Carrots", percentage: 4, source: "Local CT & NY farms", benefits: ["Beta-carotene", "Eye health"] },
    { name: "Spinach", percentage: 2, source: "Local CT & NY farms", benefits: ["Iron", "Folate", "Antioxidants"] },
    { name: "Green peas", percentage: 4, source: "Local CT & NY farms", benefits: ["Protein", "Fiber"] },
    { name: "Cod liver oil", percentage: 0.5, source: "IFOS-certified", benefits: ["EPA+DHA omega-3s", "Brain & heart health"] },
    { name: "Vitamin & Mineral Premix", percentage: 0.5, source: "NouriPet", benefits: ["Complete micronutrients", "Essential vitamins & minerals"] },
  ],
  "lamb-pumpkin-feast": [
    { name: "Lamb", percentage: 50, source: "Mosner Family Brands", benefits: ["Highly bioavailable protein", "Rich in zinc"] },
    { name: "Lamb heart", percentage: 7, source: "Mosner Family Brands", benefits: ["Taurine", "CoQ10", "B vitamins"] },
    { name: "Whole egg", percentage: 5, source: "Mosner Family Brands", benefits: ["Complete protein", "Biotin", "Choline"] },
    { name: "Pumpkin", percentage: 15, source: "Local CT & NY farms", benefits: ["Digestive support", "Beta-carotene"] },
    { name: "Peas", percentage: 10, source: "Local CT & NY farms", benefits: ["Protein", "Fiber"] },
    { name: "Spinach", percentage: 5, source: "Local CT & NY farms", benefits: ["Iron", "Folate", "Antioxidants"] },
    { name: "Cod liver oil", percentage: 0.5, source: "IFOS-certified", benefits: ["EPA+DHA omega-3s", "Brain & heart health"] },
    { name: "Vitamin & Mineral Premix", percentage: 7.5, source: "NouriPet", benefits: ["Complete micronutrients", "Essential vitamins & minerals"] },
  ],
  "low-fat-chicken-garden-veggie": [
    { name: "Chicken breast", percentage: 55, source: "Mosner Family Brands", benefits: ["High-quality lean protein", "B vitamins"] },
    { name: "Whole egg", percentage: 8, source: "Mosner Family Brands", benefits: ["Complete protein", "Biotin", "Choline"] },
    { name: "Quinoa", percentage: 15, source: "Local CT & NY farms", benefits: ["Digestible carb", "Complete amino acids"] },
    { name: "Carrots", percentage: 8, source: "Local CT & NY farms", benefits: ["Fiber", "Beta-carotene"] },
    { name: "Spinach", percentage: 8, source: "Local CT & NY farms", benefits: ["Iron", "Folate"] },
    { name: "Green peas", percentage: 3, source: "Local CT & NY farms", benefits: ["Protein", "Fiber"] },
    { name: "Vitamin & Mineral Premix", percentage: 3, source: "NouriPet", benefits: ["Essential vitamins & minerals"] },
  ],
  "turkey-brown-rice-comfort": [
    { name: "Turkey", percentage: 50, source: "Mosner Family Brands", benefits: ["Lean protein", "B vitamins"] },
    { name: "Whole egg", percentage: 5, source: "Mosner Family Brands", benefits: ["Complete protein", "Biotin", "Choline"] },
    { name: "Brown rice", percentage: 18, source: "Local CT & NY farms", benefits: ["Complex carbs", "Steady energy"] },
    { name: "Carrots", percentage: 10, source: "Local CT & NY farms", benefits: ["Beta-carotene", "Eye health"] },
    { name: "Zucchini", percentage: 8, source: "Local CT & NY farms", benefits: ["Hydration", "Fiber"] },
    { name: "Spinach", percentage: 6, source: "Local CT & NY farms", benefits: ["Iron", "Vitamins"] },
    { name: "Cod liver oil", percentage: 0.5, source: "IFOS-certified", benefits: ["EPA+DHA omega-3s", "Brain & heart health"] },
    { name: "Vitamin & Mineral Premix", percentage: 2.5, source: "NouriPet", benefits: ["Complete micronutrients", "Essential vitamins & minerals"] },
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
