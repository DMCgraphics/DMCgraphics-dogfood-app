import { redirect } from "next/navigation"
import { createServerSupabase } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { CartSummary } from "@/components/checkout/cart-summary"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"
import ZipGate from "@/components/ZipGate"

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

  // Query plans and plan items with proper RLS handling
  // First get the plans
  const { data: allPlans, error: plansError } = await supabase
    .from("plans")
    .select(`
      id,
      total_cents,
      created_at
    `)
    .eq("user_id", user.id)
    .in("status", ["active", "checkout_in_progress", "draft"])
    .order("created_at", { ascending: false })

  // Find the most recent plan
  const latestPlan = allPlans?.[0]
  
  let planWithItems = null
  let itemsError = null
  if (latestPlan) {
    // Get plan items for the latest plan with proper joins to satisfy RLS
    const { data: planItems, error: planItemsError } = await supabase
      .from("plan_items")
      .select(`
        id,
        recipe_id,
        qty,
        unit_price_cents,
        amount_cents,
        billing_interval,
        stripe_price_id,
        recipes (name, slug),
        dogs (name)
      `)
      .eq("plan_id", latestPlan.id)
    
    itemsError = planItemsError
    
    if (planItems && planItems.length > 0) {
      planWithItems = {
        ...latestPlan,
        plan_items: planItems
      }
    }
  }
  
  const data = planWithItems ? {
    plan_id: planWithItems.id,
    total_cents: planWithItems.total_cents,
    line_items: planWithItems.plan_items || []
  } : null

  const error = plansError || itemsError

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
    name: `${li.dogs?.name || 'Dog'}'s Plan`,
    description: li.recipes?.name || "Custom Recipe",
    price: (li.unit_price_cents || 0) / 100,
    quantity: li.qty || 1,
    frequency: li.billing_interval === "week" ? "Weekly delivery" : li.billing_interval || "Weekly delivery",
    dogWeight: null,
    dogActivity: null,
    foodCostPerWeek: (li.unit_price_cents || 0) / 100,
    addOnsCostPerWeek: 0,
    totalWeeklyCost: (li.unit_price_cents || 0) / 100,
    recipes: li.recipes?.name ? [li.recipes.name] : [],
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
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Delivery Information</h2>
              <p className="text-muted-foreground mb-6">
                We currently deliver to Westchester County, NY and Fairfield County, CT. 
                Please enter your ZIP code to continue to checkout.
              </p>
              <ZipGate 
                planId={data.plan_id}
                total={total}
                lineItems={data.line_items}
                userEmail={user.email}
              />
            </div>
          </div>

          <div className="space-y-6">
            <CartSummary items={lineItems} subtotal={subtotal} shipping={shipping} tax={tax} total={total} />
          </div>
        </div>
      </div>
    </div>
  )
}
