import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getPackPortion } from "@/lib/pack-portioning"

interface CartItem {
  id: string
  name: string
  description: string
  price: number
  quantity: number
  frequency: string
  dogWeight?: number
  dogActivity?: string
  recipes?: string[]
  addOns?: string[]
  foodCostPerMonth?: number
  addOnsCostPerMonth?: number
  totalMonthlyCost?: number
}

interface CartSummaryProps {
  items: CartItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
}

function calculateDailyGrams(weightKg: number, activity = "moderate"): number {
  const basePercentage = activity === "high" ? 0.03 : activity === "low" ? 0.02 : 0.025
  return Math.round(weightKg * 1000 * basePercentage)
}

export function CartSummary({ items, subtotal, shipping, tax, total }: CartSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => {
          const dogWeightKg = item.dogWeight ? item.dogWeight / 2.205 : 15
          const dailyGrams = calculateDailyGrams(dogWeightKg, item.dogActivity)
          const packInfo = getPackPortion(dailyGrams)

          return (
            <div key={item.id} className="space-y-3 pb-4 border-b border-border last:border-b-0 last:pb-0">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium">{item.name}</h4>
                  {item.recipes && item.recipes.length > 0 && (
                    <div className="mt-1">
                      <p className="text-sm font-medium text-foreground">Recipes:</p>
                      <ul className="text-sm text-muted-foreground ml-2">
                        {item.recipes.map((recipe, idx) => (
                          <li key={idx}>• {recipe}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {item.addOns && item.addOns.length > 0 && (
                    <div className="mt-1">
                      <p className="text-sm font-medium text-foreground">Add-ons:</p>
                      <ul className="text-sm text-muted-foreground ml-2">
                        {item.addOns.map((addOn, idx) => (
                          <li key={idx}>• {addOn}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Qty: {item.quantity}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {item.frequency}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {packInfo.packsPerMonth} packs/month
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Daily: {dailyGrams}g ({packInfo.packsPerDay} × {packInfo.packSize}g packs)
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${(item.price || 0).toFixed(2)}</p>
                  {(item.foodCostPerMonth || item.addOnsCostPerMonth) && (
                    <div className="text-xs text-muted-foreground mt-1 space-y-1">
                      {item.foodCostPerMonth && <div>Food: ${item.foodCostPerMonth.toFixed(2)}</div>}
                      {item.addOnsCostPerMonth && item.addOnsCostPerMonth > 0 && (
                        <div>Add-ons: ${item.addOnsCostPerMonth.toFixed(2)}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${(subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Delivery</span>
            <span className={(shipping || 0) === 0 ? "text-green-600" : ""}>
              {(shipping || 0) === 0 ? "Free" : `$${(shipping || 0).toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>${(tax || 0).toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>${(total || 0).toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
