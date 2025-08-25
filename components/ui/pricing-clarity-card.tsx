import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info } from "lucide-react"

interface PricingClarityCardProps {
  recipeNames: string[]
  mealsPerDay: number
  isMultiRecipe?: boolean
  isMedical?: boolean
}

export function PricingClarityCard({ recipeNames, mealsPerDay, isMultiRecipe, isMedical }: PricingClarityCardProps) {
  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-2 text-sm">
            <div className="font-medium text-blue-800 dark:text-blue-200">
              Pricing based on:{" "}
              {recipeNames.map((name, index) => (
                <Badge key={name} variant="outline" className="ml-1 text-blue-700 border-blue-300">
                  {name}
                </Badge>
              ))}
              , {mealsPerDay} meals/day
            </div>

            <div className="text-blue-700 dark:text-blue-300 space-y-1">
              <div>
                • Base price per 100g scales by weight class; meals/day only changes how the daily total is split
              </div>
              <div>• Changing meals/day only splits the same daily total into more/fewer meals</div>
              {isMultiRecipe && <div>• We average calories across your chosen recipes to size portions and price</div>}
              {isMedical && <div>• Prescription diet pricing includes therapeutic formulation costs</div>}
              <div>• Your price stays the same regardless of how you split the daily food</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
