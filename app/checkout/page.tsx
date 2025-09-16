import { redirect } from "next/navigation"
import { createServerSupabase } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { CartSummary } from "@/components/checkout/cart-summary"
import { ShippingForm } from "@/components/checkout/shipping-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"
import CheckoutButton from "@/components/checkout/checkout-button"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface CartItem {
  id: string
  name: string
  description: string
  price: number
  quantity: number
  frequency: string
  dogWeight?: number
  dogActivity?: string
  foodCostPerWeek?: number
  addOnsCostPerWeek?: number
  totalWeeklyCost?: number
  recipes?: string[]
  addOns?: string[]
}

export default async function CheckoutPage() {
  const supabase = createServerSupabase()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in?returnTo=/checkout")

  const { data, error } = await supabase.from("current_user_checkout_lines").select("*").single()

  if (error || !data || !Array.isArray(data.line_items) || data.line_items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>No items found in your cart. Please complete the plan builder first.</AlertDescription>
            </Alert>
            <div className="mt-6 text-center space-y-4">
              <Button asChild>
                <Link href="/plan-builder">Return to Plan Builder</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const lineItems: CartItem[] = data.line_items.map((li: any) => ({
    id: li.id,
    name: `${li.dog_name}'s Plan`,
    description: li.recipe_name || "Custom Recipe",
    price: (li.unit_amount_cents || 0) / 100,
    quantity: li.qty || 1,
    frequency: li.billing_interval === "week" ? "Weekly delivery" : li.billing_interval || "Weekly delivery",
    dogWeight: null,
    dogActivity: null,
    foodCostPerWeek: (li.unit_amount_cents || 0) / 100,
    addOnsCostPerWeek: 0,
    totalWeeklyCost: (li.unit_amount_cents || 0) / 100,
    recipes: li.recipe_name ? [li.recipe_name] : [],
    addOns: [],
  }))

  const subtotal = (data.total_cents ?? 0) / 100
  const shipping = subtotal > 50 ? 0 : 9.99
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/plan-builder">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Plan Builder
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-muted-foreground mt-2">Complete your order to start your dog's nutrition plan</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <ShippingForm />
          </div>

          <div className="space-y-6">
            <CartSummary items={lineItems} subtotal={subtotal} shipping={shipping} tax={tax} total={total} />

            <div className="space-y-4">
              <CheckoutButton planId={data.plan_id} total={total} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
