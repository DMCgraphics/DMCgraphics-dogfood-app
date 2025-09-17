"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Calendar, Package, Settings, Download } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { getPackPortion } from "@/lib/pack-portioning"
import { createBrowserClient } from "@supabase/ssr"

interface OrderData {
  orderId: string
  subscriptionId: string
  planPayload: any
  shippingData: any
  paymentData: any
  pricing: {
    subtotal: number
    discount: number
    shipping: number
    tax: number
    total: number
  }
  nextDeliveryDate: string
  timestamp: string
}

export default function OrderConfirmationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const sessionId = searchParams.get("session_id")

  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) {
      setError("No order ID provided")
      setLoading(false)
      return
    }

    const fetchOrderData = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        console.log("[v0] Fetching order data for orderId:", orderId)

        // Get plan data with proper pricing
        const { data: plan, error: planError } = await supabase
          .from("plans")
          .select(`
            *,
            plan_items (
              *,
              recipe:recipes (*)
            )
          `)
          .eq("id", orderId)
          .single()

        if (planError) {
          console.error("[v0] Error fetching plan:", planError)
          setError("Order not found")
          setLoading(false)
          return
        }

        console.log("[v0] Plan data:", plan)

        // Get the actual subscription data
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("plan_id", plan.id)
          .single()

        console.log("[v0] Subscription data:", subscription)

        // Get user profile data for shipping information
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", plan.user_id)
          .single()

        console.log("[v0] Profile data:", profile)

        const subtotal = (plan.subtotal_cents || 0) / 100
        const discount = (plan.discount_cents || 0) / 100
        const shipping = 0 // Free shipping
        const tax = Math.max(0, (subtotal - discount) * 0.08) // 8% tax on discounted subtotal
        const total = (plan.total_cents || 0) / 100 || subtotal - discount + shipping + tax

        // Create order data structure
        const orderData: OrderData = {
          orderId: plan.id,
          subscriptionId: subscription?.stripe_subscription_id || plan.stripe_session_id || sessionId || "",
          planPayload: {
            dogs: [{ name: plan.dog_name || "Your Dog" }],
            recipes: plan.plan_items?.filter((item: any) => item.recipe) || [],
            mealsPerDay: 2, // Default
            addOns: plan.plan_items?.filter((item: any) => !item.recipe).map((item: any) => item.name) || [],
          },
          shippingData: {
            firstName: profile?.first_name || "Customer",
            lastName: profile?.last_name || "",
            email: profile?.email || "",
            address: profile?.address || "",
            city: profile?.city || "",
            state: profile?.state || "",
            zipCode: profile?.zip_code || "",
          },
          paymentData: {},
          pricing: {
            subtotal,
            discount,
            shipping,
            tax,
            total,
          },
          nextDeliveryDate: subscription?.current_period_end || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          timestamp: plan.created_at || new Date().toISOString(),
        }

        setOrderData(orderData)
        console.log("[v0] Order confirmation loaded successfully")
      } catch (error) {
        console.error("[v0] Error fetching order data:", error)
        setError("Failed to load order information")
      } finally {
        setLoading(false)
      }
    }

    fetchOrderData()
  }, [orderId, sessionId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getDeliveryWindow = (dateString: string) => {
    const date = new Date(dateString)
    const startDate = new Date(date)
    startDate.setDate(date.getDate() - 1)
    const endDate = new Date(date)
    endDate.setDate(date.getDate() + 1)

    return `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
  }

  const getRenewalDate = (nextDeliveryDate: string) => {
    const date = new Date(nextDeliveryDate)
    date.setMonth(date.getMonth() + 1)
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleDownloadReceipt = () => {
    if (!orderData) return

    const dogName = orderData.planPayload.dogs[0]?.name || "Your Dog"
    const receipt = `
NouriPet Order Confirmation

Order #: ${orderData.orderId}
Subscription ID: ${orderData.subscriptionId}
Date: ${formatDate(orderData.timestamp)}

CUSTOMER INFORMATION:
${orderData.shippingData.firstName} ${orderData.shippingData.lastName}
${orderData.shippingData.email}
${orderData.shippingData.address}
${orderData.shippingData.city}, ${orderData.shippingData.state} ${orderData.shippingData.zipCode}

PLAN DETAILS:
${dogName}'s Custom Nutrition Plan
${orderData.planPayload.recipes.length > 1 ? `${orderData.planPayload.recipes.length} Recipe Variety` : "Custom Recipe"}
${orderData.planPayload.addOns.length > 0 ? `+ ${orderData.planPayload.addOns.length} Add-on${orderData.planPayload.addOns.length > 1 ? "s" : ""}` : ""}

DELIVERY SCHEDULE:
First Delivery: ${getDeliveryWindow(orderData.nextDeliveryDate)}
Monthly Renewal: ${getRenewalDate(orderData.nextDeliveryDate)}

PRICING:
Subtotal: $${orderData.pricing.subtotal.toFixed(2)}
Discount: $${orderData.pricing.discount.toFixed(2)}
Shipping: ${orderData.pricing.shipping === 0 ? "Free" : `$${orderData.pricing.shipping.toFixed(2)}`}
Tax: $${orderData.pricing.tax.toFixed(2)}
Total: $${orderData.pricing.total.toFixed(2)}

Thank you for choosing NouriPet!
    `

    const blob = new Blob([receipt], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `nouripet-receipt-${orderData.orderId}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading order confirmation...</p>
        </div>
      </div>
    )
  }

  if (error || !orderData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardContent className="pt-8 pb-8">
                <div className="text-destructive mb-4">
                  <Package className="h-16 w-16 mx-auto mb-4" />
                </div>
                <CardTitle className="text-2xl mb-4">Order Not Found</CardTitle>
                <p className="text-muted-foreground mb-6">
                  {error ||
                    "We couldn't find your order information. Please check your email for confirmation details."}
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/">Return Home</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const dogName = orderData.planPayload.dogs[0]?.name || "Your Dog"
  const recipeCount = orderData.planPayload.recipes.length
  const recipeText = recipeCount > 1 ? `${recipeCount} Recipe Variety Plan` : "Custom Recipe Plan"
  const sampleDailyGrams = 160 // Sample calculation - in production this would come from orderData
  const packInfo = getPackPortion(sampleDailyGrams)
  const biweeklyPacks = Math.ceil((packInfo.packsPerMonth / 30) * 14) // 2-week delivery cycle

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground text-lg">
              Thank you for choosing NouriPet. Your subscription is now active!
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Order Number:</span>
                      <div className="font-mono text-primary">{orderData.orderId}</div>
                    </div>
                    <div>
                      <span className="font-medium">Subscription ID:</span>
                      <div className="font-mono text-primary">{orderData.subscriptionId}</div>
                    </div>
                    <div>
                      <span className="font-medium">Order Date:</span>
                      <div>{formatDate(orderData.timestamp)}</div>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <Badge variant="default" className="ml-2">
                        Active
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Plan Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>{dogName}'s Nutrition Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{recipeText}</h3>
                      <p className="text-sm text-muted-foreground">
                        {orderData.planPayload.mealsPerDay} meals per day
                        {orderData.planPayload.addOns.length > 0 &&
                          ` + ${orderData.planPayload.addOns.length} add-on${orderData.planPayload.addOns.length > 1 ? "s" : ""}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {packInfo.packsPerDay} × {packInfo.packSize}g packs daily • {packInfo.packsPerMonth} packs/month
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${orderData.pricing.subtotal.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">per month</div>
                    </div>
                  </div>

                  {orderData.planPayload.addOns.length > 0 && (
                    <div className="pt-3 border-t">
                      <div className="text-sm font-medium mb-2">Add-ons:</div>
                      <div className="flex flex-wrap gap-1">
                        {orderData.planPayload.addOns.map((addOn: string) => (
                          <Badge key={addOn} variant="outline" className="text-xs capitalize">
                            {addOn.replace("-", " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Delivery Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Delivery Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-primary/5 rounded-lg">
                      <div className="font-medium text-primary mb-1">First Delivery</div>
                      <div className="text-sm text-muted-foreground">
                        {getDeliveryWindow(orderData.nextDeliveryDate)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {biweeklyPacks} × {packInfo.packSize}g packs ({biweeklyPacks * packInfo.packSize}g total)
                      </div>
                      <div className="text-xs text-muted-foreground">You'll receive tracking information via email</div>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="font-medium mb-1">Next Renewal</div>
                      <div className="text-sm text-muted-foreground">{getRenewalDate(orderData.nextDeliveryDate)}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {packInfo.packsPerMonth} packs monthly • Automatic delivery
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions Sidebar */}
            <div className="space-y-6">
              {/* Primary Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What's Next?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button asChild className="w-full" size="lg">
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href="/dashboard/plan">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Plan
                    </Link>
                  </Button>
                  <Button onClick={handleDownloadReceipt} variant="outline" className="w-full bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </Button>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${orderData.pricing.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Discount</span>
                    <span>${orderData.pricing.discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>
                      {orderData.pricing.shipping === 0 ? "Free" : `$${orderData.pricing.shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>${orderData.pricing.tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${orderData.pricing.total.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Support */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-sm text-muted-foreground">
                    <p className="mb-2">Need help with your order?</p>
                    <Button variant="link" className="p-0 h-auto text-sm">
                      Contact Support
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
