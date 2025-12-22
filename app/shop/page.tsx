"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Package, Sparkles, Check, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/header"
import { useAuth } from "@/contexts/auth-context"
import { CountdownTimer } from "@/components/countdown-timer"

// Individual pack recipes
const recipes = [
  {
    id: "beef",
    name: "Beef & Quinoa Harvest",
    description: "Rich in protein with wholesome quinoa and garden vegetables",
    image: "/images/beef-recipe.jpg",
    singlePrice: 7.00,
    threePackPrice: 20.00,
  },
  {
    id: "chicken",
    name: "Chicken & Garden Veggie",
    description: "Lean protein with fresh vegetables for everyday nutrition",
    image: "/images/chicken-recipe.jpg",
    singlePrice: 7.00,
    threePackPrice: 20.00,
  },
  {
    id: "lamb",
    name: "Lamb & Pumpkin Feast",
    description: "Tender lamb with digestive-friendly pumpkin",
    image: "/images/lamb-recipe.jpg",
    singlePrice: 7.00,
    threePackPrice: 20.00,
  },
  {
    id: "turkey",
    name: "Turkey & Brown Rice Comfort",
    description: "Gentle on stomachs with nutritious brown rice",
    image: "/images/turkey-recipe.jpg",
    singlePrice: 7.00,
    threePackPrice: 20.00,
  },
]

// Topper plan options
const topperPlans = [
  {
    id: "25",
    name: "25% Topper",
    description: "Perfect for adding variety to kibble",
    badge: "Most Popular",
    badgeColor: "bg-green-100 text-green-800",
    features: [
      "25% of daily nutrition from fresh food",
      "Mix with your dog's current kibble",
      "Bi-weekly delivery",
      "Cancel or modify anytime",
    ],
  },
  {
    id: "50",
    name: "50% Topper",
    description: "Half fresh, half kibble",
    features: [
      "50% of daily nutrition from fresh food",
      "Great transition to fresh food",
      "Bi-weekly delivery",
      "Cancel or modify anytime",
    ],
  },
  {
    id: "75",
    name: "75% Topper",
    description: "Mostly fresh food",
    features: [
      "75% of daily nutrition from fresh food",
      "Minimal kibble supplementation",
      "Bi-weekly delivery",
      "Cancel or modify anytime",
    ],
  },
]

// Price table by dog size
const topperPrices: Record<string, Record<string, number>> = {
  small: { "25": 15.00, "50": 29.00, "75": 44.00 },
  medium: { "25": 24.00, "50": 47.00, "75": 71.00 },
  large: { "25": 35.00, "50": 69.00, "75": 104.00 },
  xl: { "25": 44.00, "50": 87.00, "75": 131.00 },
}

type DogSize = "small" | "medium" | "large" | "xl"

export default function ShopPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedDogSize, setSelectedDogSize] = useState<DogSize>("medium")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingItem, setLoadingItem] = useState<string | null>(null)

  // Stripe price IDs for individual packs (same for all recipes)
  // Test mode: price_1STtdA0R4BbWwBbf9G5uIXl3 (single), price_1STteJ0R4BbWwBbfCeqiKDkO (3-pack)
  // Prod mode: price_1SL20Q0WbfuHe9kA8HUhNY1T (single), price_1SL24L0WbfuHe9kAWCDXHoc9 (3-pack)
  const SINGLE_PACK_PRICE_ID = "price_1STtdA0R4BbWwBbf9G5uIXl3"
  const THREE_PACK_PRICE_ID = "price_1STteJ0R4BbWwBbfCeqiKDkO"

  const handleBuyIndividualPack = async (recipeId: string, quantity: 1 | 3) => {
    const recipe = recipes.find(r => r.id === recipeId)
    if (!recipe) return

    // For 3-packs, redirect to individual-packs page to select 3 recipes
    if (quantity === 3) {
      router.push('/shop/individual-packs')
      return
    }

    // For single packs, proceed with direct checkout
    const priceId = SINGLE_PACK_PRICE_ID
    const loadingKey = `${recipeId}-${quantity}`

    setIsLoading(true)
    setLoadingItem(loadingKey)

    try {
      // Use guest checkout API for individual packs (no login required)
      const response = await fetch('/api/guest-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          productType: "individual",
          recipeName: recipe.name,
          quantity,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Error starting checkout:", error)
      alert("Failed to start checkout. Please try again.")
      setIsLoading(false)
      setLoadingItem(null)
    }
  }

  const handleStartTopperPlan = (topperLevel: string) => {
    if (!user) {
      router.push(`/auth/login?redirect=/shop`)
      return
    }
    // Redirect to plan builder with topper mode
    router.push(`/plan-builder?mode=topper&level=${topperLevel}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">Fresh Food Shop</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Try our fresh recipes or subscribe to topper plans for your pup
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          <CountdownTimer />
        </div>

        <Tabs defaultValue="individual" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="individual" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Individual Packs
            </TabsTrigger>
            <TabsTrigger value="toppers" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Topper Plans
            </TabsTrigger>
          </TabsList>

          {/* Individual Packs Tab */}
          <TabsContent value="individual" className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Try Before You Subscribe</h2>
              <p className="text-muted-foreground">
                Perfect for testing new recipes or as a treat - no subscription required
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Single Pack Card */}
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/shop/individual-packs')}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">Single Pack</CardTitle>
                    <Badge className="bg-blue-100 text-blue-800">Try It</Badge>
                  </div>
                  <CardDescription>Try one pack to see if your dog loves it</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-4xl font-bold">$7.00</div>
                    <div className="text-sm text-muted-foreground">per pack</div>
                  </div>

                  <div className="text-sm space-y-2">
                    <p className="font-medium">What's included:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>✓ 1 fresh food pack (8 oz)</li>
                      <li>✓ Choice of 4 premium recipes</li>
                      <li>✓ No subscription required</li>
                      <li>✓ Free local delivery</li>
                    </ul>
                  </div>

                  <Button className="w-full" size="lg">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Choose Your Recipe
                  </Button>
                </CardContent>
              </Card>

              {/* 3 Pack Bundle Card */}
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-primary/50" onClick={() => router.push('/shop/individual-packs')}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">3 Pack Bundle</CardTitle>
                    <div className="flex gap-2">
                      <Badge className="bg-green-100 text-green-800">Best Value</Badge>
                      <Badge variant="outline" className="text-green-700 border-green-300">Save $1</Badge>
                    </div>
                  </div>
                  <CardDescription>Perfect sample size - mix and match 3 recipes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-4xl font-bold">$20.00</div>
                    <div className="text-sm text-muted-foreground">$6.67 per pack</div>
                  </div>

                  <div className="text-sm space-y-2">
                    <p className="font-medium">What's included:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>✓ 3 fresh food packs (8 oz each)</li>
                      <li>✓ Choose 3 different recipes</li>
                      <li>✓ No subscription required</li>
                      <li>✓ Free local delivery</li>
                    </ul>
                  </div>

                  <Button className="w-full" size="lg">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Choose Your 3 Recipes
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-muted/50 max-w-4xl mx-auto">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Why try individual packs?</p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• Test new recipes before committing to a subscription</li>
                      <li>• Great as a supplement or special treat</li>
                      <li>• Same fresh, local ingredients as our subscription plans</li>
                      <li>• Free local delivery</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Topper Plans Tab */}
          <TabsContent value="toppers" className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Fresh Food Topper Plans</h2>
              <p className="text-muted-foreground">
                Add fresh nutrition to your dog's current diet - delivered bi-weekly
              </p>
            </div>

            {/* Dog Size Selector */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">Select your dog's size for pricing:</p>
                    <p className="text-sm text-muted-foreground">Prices vary based on your dog's weight</p>
                  </div>
                  <div className="flex gap-2">
                    {[
                      { id: "small", label: "Small", weight: "<20 lbs" },
                      { id: "medium", label: "Medium", weight: "20-50 lbs" },
                      { id: "large", label: "Large", weight: "50-100 lbs" },
                      { id: "xl", label: "XL", weight: "100+ lbs" },
                    ].map((size) => (
                      <Button
                        key={size.id}
                        variant={selectedDogSize === size.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedDogSize(size.id as DogSize)}
                        className="flex flex-col h-auto py-2"
                      >
                        <span>{size.label}</span>
                        <span className="text-xs opacity-70">{size.weight}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
              {topperPlans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative ${plan.badge ? "ring-2 ring-primary ring-offset-2" : ""}`}
                >
                  {plan.badge && (
                    <Badge className={`absolute -top-3 left-1/2 -translate-x-1/2 ${plan.badgeColor}`}>
                      {plan.badge}
                    </Badge>
                  )}
                  <CardHeader className="text-center pt-8">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold">
                        ${topperPrices[selectedDogSize][plan.id].toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">every 2 weeks</div>
                    </div>

                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => handleStartTopperPlan(plan.id)}
                    >
                      Get Started
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Why choose a topper plan?</p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• Boost nutrition without fully switching from kibble</li>
                      <li>• Gradual transition to fresh food</li>
                      <li>• More affordable than full fresh food plans</li>
                      <li>• Flexible - change your plan level anytime</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Want 100% fresh food for your dog?
              </p>
              <Button variant="outline" size="lg" asChild>
                <Link href="/plan-builder">
                  Build a Full Meal Plan
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
