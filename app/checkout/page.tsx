"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CartSummary } from "@/components/checkout/cart-summary"
import { ShippingForm } from "@/components/checkout/shipping-form"
import { PaymentForm } from "@/components/checkout/payment-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface PlanPayload {
  planId: string
  dogs: Array<{
    name: string
    age: number
    weight: number
    weightUnit: string
    activity: string
    bodyCondition: number
  }>
  recipes: string[]
  prescriptionDiet?: string | null
  mealsPerDay: number
  planType: string
  priceMonthly: number
  addOns: string[]
  healthGoals: any
  selectedAllergens: string[]
}

export default function CheckoutPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [shippingData, setShippingData] = useState({})
  const [paymentData, setPaymentData] = useState({})
  const [planPayload, setPlanPayload] = useState<PlanPayload | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const savedPlan = localStorage.getItem("nouripet-checkout-plan")
    if (savedPlan) {
      try {
        const plan = JSON.parse(savedPlan)
        setPlanPayload(plan)
        console.log("[v0] checkout_page_loaded", { planId: plan.planId })
      } catch (error) {
        console.error("Failed to load plan payload:", error)
        setError("Failed to load plan data. Please return to plan builder.")
      }
    } else {
      setError("No plan data found. Please complete the plan builder first.")
    }
  }, [])

  const calculatePricing = () => {
    if (!planPayload) return { subtotal: 0, shipping: 0, tax: 0, total: 0 }

    const subtotal = planPayload.priceMonthly || 89.99 // Fallback for demo
    const shipping = subtotal > 50 ? 0 : 9.99 // Free shipping over $50
    const tax = subtotal * 0.08 // 8% tax rate
    const total = subtotal + shipping + tax

    return { subtotal, shipping, tax, total }
  }

  const { subtotal, shipping, tax, total } = calculatePricing()

  const generateCartItems = () => {
    if (!planPayload) return []

    const dogName = planPayload.dogs[0]?.name || "Your Dog"
    const recipeCount = planPayload.recipes.length
    const recipeText = recipeCount > 1 ? `${recipeCount} Recipe Variety` : "Custom Recipe"
    const addOnText =
      planPayload.addOns.length > 0
        ? ` + ${planPayload.addOns.length} Add-on${planPayload.addOns.length > 1 ? "s" : ""}`
        : ""

    return [
      {
        id: planPayload.planId,
        name: `${dogName}'s Custom Plan`,
        description: `${recipeText}${addOnText}`,
        price: subtotal,
        quantity: 1,
        frequency: "Monthly delivery",
      },
    ]
  }

  const cartItems = generateCartItems()

  const handleShippingChange = (field: string, value: string) => {
    setShippingData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePaymentChange = (field: string, value: string) => {
    setPaymentData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePlaceOrder = async () => {
    if (!planPayload) return

    setIsProcessing(true)
    setError(null)

    try {
      console.log("[v0] checkout_started", {
        planId: planPayload.planId,
        total: total.toFixed(2),
        paymentMethod: "demo",
      })

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generate order ID
      const orderId = `NOU-${Date.now()}`
      const paymentIntentId = `pi_${Date.now()}`

      // Create subscription after successful payment
      const subscriptionData = await createSubscription(orderId, planPayload, paymentIntentId)

      console.log("[v0] checkout_completed", {
        orderId,
        subscriptionId: subscriptionData.subscriptionId,
        total: total.toFixed(2),
      })

      // Store order data for confirmation page
      const orderData = {
        orderId,
        subscriptionId: subscriptionData.subscriptionId,
        planPayload,
        shippingData,
        paymentData,
        pricing: { subtotal, shipping, tax, total },
        nextDeliveryDate: subscriptionData.nextDeliveryDate,
        timestamp: new Date().toISOString(),
      }

      localStorage.setItem("nouripet-order-confirmation", JSON.stringify(orderData))

      // Redirect to confirmation page
      router.push(`/order/confirmation?orderId=${orderId}`)
    } catch (error) {
      console.error("Order processing failed:", error)
      setError("Payment processing failed. Please try again.")
      console.log("[v0] checkout_failed", { error: error.message })
    } finally {
      setIsProcessing(false)
    }
  }

  const createSubscription = async (orderId: string, plan: PlanPayload, paymentIntentId: string) => {
    // Simulate API call to create subscription
    console.log("[v0] creating_subscription", { orderId, planId: plan.planId, paymentIntentId })

    // Check for existing subscription (idempotency)
    const existingSubscription = localStorage.getItem(`subscription_${paymentIntentId}`)
    if (existingSubscription) {
      return JSON.parse(existingSubscription)
    }

    // Create new subscription
    const subscriptionData = {
      subscriptionId: `sub_${Date.now()}`,
      planId: plan.planId,
      orderId,
      paymentIntentId,
      status: "active",
      nextDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      createdAt: new Date().toISOString(),
    }

    // Store subscription (simulate database)
    localStorage.setItem(`subscription_${paymentIntentId}`, JSON.stringify(subscriptionData))

    console.log("[v0] subscription_created", {
      subscriptionId: subscriptionData.subscriptionId,
      nextDeliveryDate: subscriptionData.nextDeliveryDate,
    })

    return subscriptionData
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-6 text-center">
              <Button asChild>
                <Link href="/plan-builder">Return to Plan Builder</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!planPayload) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading checkout...</p>
        </div>
      </div>
    )
  }

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

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {currentStep >= 1 && <ShippingForm formData={shippingData} onFormChange={handleShippingChange} />}

            {currentStep >= 2 && <PaymentForm formData={paymentData} onFormChange={handlePaymentChange} />}
          </div>

          <div className="space-y-6">
            <CartSummary items={cartItems} subtotal={subtotal} shipping={shipping} tax={tax} total={total} />

            <div className="space-y-4">
              {currentStep === 1 && (
                <Button
                  onClick={() => setCurrentStep(2)}
                  className="w-full"
                  size="lg"
                  disabled={!shippingData.firstName || !shippingData.email || !shippingData.address}
                >
                  Continue to Payment
                </Button>
              )}

              {currentStep === 2 && (
                <Button
                  onClick={handlePlaceOrder}
                  className="w-full"
                  size="lg"
                  disabled={isProcessing || !paymentData.cardNumber || !paymentData.cardName}
                >
                  {isProcessing ? "Processing..." : `Complete Order - $${total.toFixed(2)}`}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
