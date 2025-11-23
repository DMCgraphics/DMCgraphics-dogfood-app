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
  small: { "25": 6.50, "50": 13.00, "75": 19.50 },
  medium: { "25": 10.50, "50": 21.00, "75": 31.50 },
  large: { "25": 15.50, "50": 31.00, "75": 46.50 },
  xl: { "25": 19.50, "50": 39.00, "75": 58.50 },
}

type DogSize = "small" | "medium" | "large" | "xl"

export default function ShopPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedDogSize, setSelectedDogSize] = useState<DogSize>("medium")

  const handleBuyIndividualPack = (recipeId: string, quantity: 1 | 3) => {
    if (!user) {
      router.push(`/auth/login?redirect=/shop`)
      return
    }
    // Redirect to individual packs page with recipe pre-selected
    router.push(`/shop/individual-packs?recipe=${recipeId}&quantity=${quantity}`)
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

            <div className="grid md:grid-cols-2 gap-6">
              {recipes.map((recipe) => (
                <Card key={recipe.id} className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>{recipe.name}</CardTitle>
                    <CardDescription>{recipe.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 border rounded-lg text-center">
                        <div className="text-2xl font-bold">${recipe.singlePrice.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">Single Pack</div>
                        <div className="text-xs text-muted-foreground">8 oz</div>
                        <Button
                          size="sm"
                          className="mt-3 w-full"
                          onClick={() => handleBuyIndividualPack(recipe.id, 1)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Buy Now
                        </Button>
                      </div>
                      <div className="p-4 border rounded-lg text-center relative">
                        <Badge className="absolute -top-2 -right-2 bg-green-100 text-green-800">
                          Save $1
                        </Badge>
                        <div className="text-2xl font-bold">${recipe.threePackPrice.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">3 Pack Bundle</div>
                        <div className="text-xs text-muted-foreground">$6.67 each</div>
                        <Button
                          size="sm"
                          className="mt-3 w-full"
                          onClick={() => handleBuyIndividualPack(recipe.id, 3)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Buy Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-muted/50">
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
