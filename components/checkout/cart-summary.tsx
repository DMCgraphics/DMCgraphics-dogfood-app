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
}

interface CartSummaryProps {
  items: CartItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
}

export function CartSummary({ items, subtotal, shipping, tax, total }: CartSummaryProps) {
  const sampleDailyGrams = 160 // Sample calculation
  const packInfo = getPackPortion(sampleDailyGrams)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="font-medium">{item.name}</h4>
              <p className="text-sm text-muted-foreground">{item.description}</p>
              <div className="flex items-center gap-2 mt-1">
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
                Daily: {sampleDailyGrams}g ({packInfo.packsPerDay} × {packInfo.packSize}g packs)
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">${item.price.toFixed(2)}</p>
            </div>
          </div>
        ))}

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
