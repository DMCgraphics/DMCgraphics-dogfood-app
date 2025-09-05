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
  "chicken-greens": [
    {
      name: "Deboned Chicken",
      percentage: 35,
      source: "Sunrise Poultry Farm, Litchfield, CT",
      benefits: ["High-quality protein", "Essential amino acids", "Muscle development"],
    },
    {
      name: "Sweet Potatoes",
      percentage: 20,
      source: "Hudson Valley Organic, Rhinebeck, NY",
      benefits: ["Complex carbohydrates", "Beta-carotene", "Digestive fiber"],
    },
    {
      name: "Green Peas",
      percentage: 15,
      source: "Green Mountain Co-op, Waterbury, CT",
      benefits: ["Plant protein", "Vitamins A, C, K", "Antioxidants"],
    },
    {
      name: "Chicken Meal",
      percentage: 10,
      source: "Sunrise Poultry Farm, Litchfield, CT",
      benefits: ["Concentrated protein", "Glucosamine", "Essential minerals"],
    },
    {
      name: "Carrots",
      percentage: 8,
      source: "Valley Fresh Farms, New Paltz, NY",
      benefits: ["Beta-carotene", "Fiber", "Natural sweetness"],
    },
    {
      name: "Spinach",
      percentage: 5,
      source: "Organic Greens Co, Middletown, CT",
      benefits: ["Iron", "Folate", "Antioxidants"],
    },
    {
      name: "Flaxseed",
      percentage: 3,
      source: "Hudson Seed Company, Kingston, NY",
      benefits: ["Omega-3 fatty acids", "Fiber", "Lignans"],
    },
    {
      name: "Blueberries",
      percentage: 2,
      source: "Berry Hill Farm, Guilford, CT",
      benefits: ["Antioxidants", "Vitamin C", "Cognitive support"],
    },
    {
      name: "Vitamins & Minerals",
      percentage: 2,
      source: "NutriBlend Facility, Hartford, CT",
      benefits: ["Complete nutrition", "AAFCO compliance", "Optimal health"],
    },
  ],
  "beef-quinoa-harvest": [
    {
      name: "Grass-Fed Beef",
      percentage: 36,
      source: "Heritage Ranch, Dutchess County, NY",
      benefits: ["Premium protein", "Iron", "B-vitamins"],
    },
    {
      name: "Quinoa",
      percentage: 17,
      source: "Connecticut Valley Grains, Middletown, CT",
      benefits: ["Complete protein", "Essential amino acids", "Gluten-free carbs"],
    },
    {
      name: "Beef Liver",
      percentage: 12,
      source: "Heritage Ranch, Dutchess County, NY",
      benefits: ["Vitamin A", "Iron", "Natural flavor"],
    },
    {
      name: "Sweet Potatoes",
      percentage: 11,
      source: "Rocky Hill Farms, Glastonbury, CT",
      benefits: ["Complex carbs", "Beta-carotene", "Fiber"],
    },
    {
      name: "Butternut Squash",
      percentage: 8,
      source: "Mountain View Organic, Poughkeepsie, NY",
      benefits: ["Vitamins A, C", "Potassium", "Antioxidants"],
    },
    {
      name: "Leafy Greens",
      percentage: 6,
      source: "Organic Greens Co, Middletown, CT",
      benefits: ["Iron", "Folate", "Antioxidants"],
    },
    {
      name: "Yams",
      percentage: 4,
      source: "Valley Fresh Farms, New Paltz, NY",
      benefits: ["Beta-carotene", "Fiber", "Natural sweetness"],
    },
    {
      name: "Wild Alaskan Fish Oil",
      percentage: 4,
      source: "Premium Oils Processing, Stamford, CT",
      benefits: ["EPA (180mg/100g)", "DHA (120mg/100g)", "Skin & coat health", "Joint support"],
    },
    {
      name: "Vitamins & Minerals",
      percentage: 2,
      source: "NutriBlend Facility, Hartford, CT",
      benefits: ["Complete nutrition", "AAFCO compliance", "Joint support"],
    },
  ],
  "lamb-pumpkin-quinoa": [
    {
      name: "Ground Lamb",
      percentage: 45,
      source: "Hudson Valley Lamb Co-op, NY",
      benefits: ["Bioavailable protein", "Iron", "B vitamins"],
    },
    {
      name: "Pumpkin",
      percentage: 20,
      source: "Local CT farms",
      benefits: ["Soluble fiber", "Beta-carotene", "Digestive support"],
    },
    {
      name: "Quinoa",
      percentage: 15,
      source: "Connecticut Valley Grains, CT",
      benefits: ["Complete amino acids", "Complex carbs"],
    },
    { name: "Lamb Liver", percentage: 8, source: "Hudson Valley Lamb Co-op, NY", benefits: ["Vitamin A", "Copper"] },
    {
      name: "Leafy Greens (Spinach/Kale)",
      percentage: 7,
      source: "Regional growers",
      benefits: ["Folate", "Iron", "Antioxidants"],
    },
    { name: "Wild Alaskan Fish Oil", percentage: 3, source: "Premium Oils Processing", benefits: ["EPA/DHA omega-3s"] },
    { name: "Flax Seed", percentage: 2, source: "Northeast Grain Collective", benefits: ["ALA omega-3", "Fiber"] },
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
