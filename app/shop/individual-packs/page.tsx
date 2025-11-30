"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, ArrowLeft, Check, Loader2, Plus } from "lucide-react"
import Link from "next/link"
import { useCart } from "@/contexts/cart-context"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/header"

function IndividualPacksContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dogId = searchParams.get('dogId')
  const dogName = searchParams.get('dogName')
  const { addItem } = useCart()
  const { toast } = useToast()

  const [selectedQuantity, setSelectedQuantity] = useState<1 | 3 | null>(null)
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Universal Stripe price IDs (same for all recipes)
  // Detect environment based on URL
  const isProduction = typeof window !== 'undefined' && window.location.hostname === 'www.nouripet.net'

  // Test mode: price_1STtdA0R4BbWwBbf9G5uIXl3 (single), price_1SZGBZ0R4BbWwBbf1Vgv8Cd3 (3-pack)
  // Prod mode: price_1SL20Q0WbfuHe9kA8HUhNY1T (single), price_1SZGBy0WbfuHe9kAZen2JI5A (3-pack)
  const SINGLE_PACK_PRICE_ID = isProduction
    ? "price_1SL20Q0WbfuHe9kA8HUhNY1T"
    : "price_1STtdA0R4BbWwBbf9G5uIXl3"
  const THREE_PACK_PRICE_ID = isProduction
    ? "price_1SZGBy0WbfuHe9kAZen2JI5A"
    : "price_1SZGBZ0R4BbWwBbf1Vgv8Cd3"

  const recipes = [
    {
      id: "beef",
      name: "Beef & Quinoa Harvest",
      description: "Rich in protein with wholesome quinoa",
    },
    {
      id: "chicken",
      name: "Chicken & Garden Veggie",
      description: "Lean protein with fresh vegetables",
    },
    {
      id: "lamb",
      name: "Lamb & Pumpkin Feast",
      description: "Tender lamb with digestive-friendly pumpkin",
    },
    {
      id: "turkey",
      name: "Turkey & Brown Rice Comfort",
      description: "Gentle on stomachs with brown rice",
    },
  ]

  const packOptions = [
    {
      quantity: 1 as const,
      name: "Single Pack",
      description: "Try one pack to see if your dog loves it",
      price: 7.00,
      badge: "Try It",
      badgeColor: "bg-blue-100 text-blue-800"
    },
    {
      quantity: 3 as const,
      name: "3 Pack Bundle",
      description: "Perfect sample size - save $1",
      price: 20.00,
      badge: "Best Value",
      badgeColor: "bg-green-100 text-green-800",
      savings: "Save $1"
    }
  ]

  const handleQuantitySelection = (quantity: 1 | 3) => {
    setSelectedQuantity(quantity)
    setSelectedRecipes([]) // Reset recipe selection when changing quantity
  }

  const handleRecipeToggle = (recipeId: string) => {
    if (!selectedQuantity) return

    const maxRecipes = selectedQuantity === 1 ? 1 : 3
    const isSelected = selectedRecipes.includes(recipeId)

    if (isSelected) {
      // Remove from selection
      setSelectedRecipes(prev => prev.filter(id => id !== recipeId))
    } else {
      // Add to selection if not at max
      if (selectedRecipes.length < maxRecipes) {
        if (selectedQuantity === 1) {
          // For single pack, replace the selection
          setSelectedRecipes([recipeId])
        } else {
          // For 3-pack, add to selection
          setSelectedRecipes(prev => [...prev, recipeId])
        }
      }
    }
  }

  const handleAddToCart = () => {
    if (!selectedQuantity) return

    const requiredRecipes = selectedQuantity === 1 ? 1 : 3
    if (selectedRecipes.length !== requiredRecipes) return

    const selectedPackOption = packOptions.find(o => o.quantity === selectedQuantity)
    if (!selectedPackOption) return

    // Build recipes array
    const recipesData = selectedRecipes.map(recipeId => {
      const recipe = recipes.find(r => r.id === recipeId)
      return { id: recipe?.id || recipeId, name: recipe?.name || recipeId }
    })

    addItem({
      type: selectedQuantity === 1 ? "single-pack" : "3-pack",
      recipes: recipesData,
      price: selectedPackOption.price,
      quantity: 1,
    })

    toast({
      title: "Added to cart",
      description: `${selectedPackOption.name} with ${selectedQuantity === 1 ? "1 recipe" : "3 recipes"} added to your cart.`,
    })

    // Reset selection after adding to cart
    setSelectedQuantity(null)
    setSelectedRecipes([])
  }

  const handleCheckout = async () => {
    if (!selectedQuantity) return

    const requiredRecipes = selectedQuantity === 1 ? 1 : 3
    if (selectedRecipes.length !== requiredRecipes) return

    const priceId = selectedQuantity === 1 ? SINGLE_PACK_PRICE_ID : THREE_PACK_PRICE_ID

    setIsLoading(true)

    try {
      // Build recipes array
      const recipesData = selectedRecipes.map(recipeId => {
        const recipe = recipes.find(r => r.id === recipeId)
        return { id: recipe?.id || recipeId, name: recipe?.name || recipeId }
      })

      const response = await fetch('/api/topper-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          dogId,
          dogName,
          productType: selectedQuantity === 1 ? "individual" : "3-packs",
          recipes: recipesData,
          isSubscription: false,
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
    } finally {
      setIsLoading(false)
    }
  }

  const canCheckout = selectedQuantity && selectedRecipes.length === (selectedQuantity === 1 ? 1 : 3)
  const selectedPackOption = packOptions.find(o => o.quantity === selectedQuantity)

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="container py-8 max-w-4xl">
          <Button variant="ghost" asChild className="mb-6">
            <Link href={dogName ? "/dashboard" : "/shop"}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {dogName ? "Back to Dashboard" : "Back to Shop"}
            </Link>
          </Button>

        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Buy Individual Packs</h1>
            <p className="text-muted-foreground mt-2">
              {dogName ? `Fresh food for ${dogName} - no subscription required` : "Try our fresh recipes - no subscription required"}
            </p>
          </div>

          {/* Step 1: Quantity Selection */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Step 1: Choose Quantity</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Select how many packs you'd like
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {packOptions.map((option) => (
                <Card
                  key={option.quantity}
                  className={`cursor-pointer transition-all ${
                    selectedQuantity === option.quantity
                      ? "ring-2 ring-primary ring-offset-2"
                      : "hover:shadow-lg"
                  }`}
                  onClick={() => handleQuantitySelection(option.quantity)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedQuantity === option.quantity
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {selectedQuantity === option.quantity && (
                          <Check className="h-4 w-4 text-primary-foreground" />
                        )}
                      </div>
                      <div className="flex gap-2">
                        {option.badge && (
                          <Badge className={option.badgeColor}>
                            {option.badge}
                          </Badge>
                        )}
                        {option.savings && (
                          <Badge variant="outline" className="text-green-700 border-green-300">
                            {option.savings}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-2xl">{option.name}</CardTitle>
                    <CardDescription className="text-base mt-2">
                      {option.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-3xl font-bold">
                          ${option.price.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ${(option.price / option.quantity).toFixed(2)} per pack
                        </div>
                      </div>

                      <div className="text-sm space-y-2">
                        <p className="font-medium">What's included:</p>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>✓ {option.quantity} fresh food {option.quantity === 1 ? "pack" : "packs"} (8 oz each)</li>
                          <li>✓ Premium ingredients</li>
                          <li>✓ No subscription required</li>
                          <li>✓ Free local delivery</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Step 2: Recipe Selection */}
          {selectedQuantity && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">
                  Step 2: Choose Your {selectedQuantity === 1 ? "Recipe" : "3 Recipes"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedQuantity === 1
                    ? "Select the recipe you'd like to try"
                    : `Select 3 different recipes for your 3-pack (${selectedRecipes.length}/3 selected)`
                  }
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {recipes.map((recipe) => {
                  const isSelected = selectedRecipes.includes(recipe.id)
                  const maxRecipes = selectedQuantity === 1 ? 1 : 3
                  const canSelect = selectedRecipes.length < maxRecipes || isSelected

                  return (
                    <Card
                      key={recipe.id}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? "ring-2 ring-primary ring-offset-2"
                          : !canSelect
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:shadow-lg"
                      }`}
                      onClick={() => handleRecipeToggle(recipe.id)}
                    >
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected
                                ? "border-primary bg-primary"
                                : "border-muted-foreground"
                            }`}
                          >
                            {isSelected && (
                              <Check className="h-3 w-3 text-primary-foreground" />
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{recipe.name}</CardTitle>
                            <CardDescription className="text-sm mt-1">
                              {recipe.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  )
                })}
              </div>
              {selectedQuantity === 3 && selectedRecipes.length === 3 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-medium">
                    Perfect! You've selected 3 recipes for your 3-pack bundle.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Info Card */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <ShoppingCart className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-2 flex-1">
                  <p className="font-medium">Why try individual packs?</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Perfect for testing new recipes before committing to a subscription</li>
                    <li>• Great as a supplement to your dog's current diet</li>
                    <li>• One-time purchase - no commitment required</li>
                    <li>• Same fresh, local ingredients as our subscription plans</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={handleAddToCart}
                disabled={!canCheckout}
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              <Button
                onClick={handleCheckout}
                disabled={!canCheckout || isLoading}
                size="lg"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {isLoading
                  ? "Processing..."
                  : canCheckout
                    ? `Buy Now - $${selectedPackOption?.price.toFixed(2) || 0}`
                    : selectedQuantity
                      ? `Select ${selectedQuantity === 1 ? "Recipe" : "3 Recipes"}`
                      : "Select Quantity & Recipes"}
              </Button>
            </div>
            {!canCheckout && (
              <p className="text-sm text-muted-foreground text-center">
                {!selectedQuantity
                  ? "Choose a quantity and recipes to continue"
                  : `Select ${selectedQuantity === 1 ? "1 recipe" : "3 recipes"} to continue`
                }
              </p>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  )
}

function IndividualPacksLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-lg">Loading...</span>
      </div>
    </div>
  )
}

export default function IndividualPacksPage() {
  return (
    <Suspense fallback={<IndividualPacksLoading />}>
      <IndividualPacksContent />
    </Suspense>
  )
}
