"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Check } from "lucide-react"

interface TopperPurchaseDialogProps {
  dogId: string
  dogName: string
  dogWeight: number
  dogWeightUnit: "lb" | "kg"
  children: React.ReactNode
}

type TopperOption = "25" | "50" | "75"
type DogSize = "small" | "medium" | "large" | "xl"

// Price IDs by environment and size
// Test/Sandbox Price IDs (sk_test_...)
// NOTE: Test price IDs need to be updated in Stripe test mode if using test environment
const testPriceIds: Record<DogSize, Record<TopperOption, string>> = {
  small: {
    "25": "price_1SWJxb0R4BbWwBbfVA5IBfGv",
    "50": "price_1SWJxb0R4BbWwBbfAuVzB9gn",
    "75": "price_1SWJxb0R4BbWwBbfukkyjoMG",
  },
  medium: {
    "25": "price_1SWJxc0R4BbWwBbfpXUvIOPp",
    "50": "price_1SWJxc0R4BbWwBbfDFVH0o4p",
    "75": "price_1SWJxd0R4BbWwBbfSQAsNJHW",
  },
  large: {
    "25": "price_1SWJxd0R4BbWwBbfeCuwcPy9",
    "50": "price_1SWJxd0R4BbWwBbfjhnoOngK",
    "75": "price_1SWJxe0R4BbWwBbfhuaK5zGR",
  },
  xl: {
    "25": "price_1SWJxe0R4BbWwBbfdR559REx",
    "50": "price_1SWJxe0R4BbWwBbf1st8bqEP",
    "75": "price_1SWJxf0R4BbWwBbfACrG4vhJ",
  },
}

// Live/Production Price IDs (sk_live_...)
const livePriceIds: Record<DogSize, Record<TopperOption, string>> = {
  small: {
    "25": "price_1SXjwS0WbfuHe9kA2iuWo1eZ",
    "50": "price_1SXjx50WbfuHe9kAr2JlBEjX",
    "75": "price_1SWJzN0WbfuHe9kAONAtGz3X",
  },
  medium: {
    "25": "price_1SXjyG0WbfuHe9kAiU4BTyhw",
    "50": "price_1SXjz30WbfuHe9kAINB2sGgI",
    "75": "price_1SWJzP0WbfuHe9kAeoHNdmGS",
  },
  large: {
    "25": "price_1SWJzP0WbfuHe9kAxg6CeyiM",
    "50": "price_1SWJzP0WbfuHe9kAjUYsaqBC",
    "75": "price_1SWJzQ0WbfuHe9kAQ3sylBEl",
  },
  xl: {
    "25": "price_1SWJzQ0WbfuHe9kA697GdnPz",
    "50": "price_1SWJzQ0WbfuHe9kA38OztrDK",
    "75": "price_1SWJzR0WbfuHe9kASGjhdWlu",
  },
}

// Prices by size (bi-weekly)
const pricesBySize: Record<DogSize, Record<TopperOption, number>> = {
  small: { "25": 15.00, "50": 29.00, "75": 44.00 },
  medium: { "25": 24.00, "50": 47.00, "75": 71.00 },
  large: { "25": 35.00, "50": 69.00, "75": 104.00 },
  xl: { "25": 44.00, "50": 87.00, "75": 131.00 },
}

// Determine dog size from weight
function getDogSize(weightLbs: number): DogSize {
  if (weightLbs < 20) return "small"
  if (weightLbs < 50) return "medium"
  if (weightLbs < 100) return "large"
  return "xl"
}

// Check if we're in test mode
function isTestMode(): boolean {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
  return publishableKey.startsWith("pk_test_")
}

export function TopperPurchaseDialog({ dogId, dogName, dogWeight, dogWeightUnit, children }: TopperPurchaseDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedOption, setSelectedOption] = useState<TopperOption | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Convert weight to lbs if needed and determine size
  const weightInLbs = dogWeightUnit === "kg" ? dogWeight * 2.205 : dogWeight
  const dogSize = getDogSize(weightInLbs)

  // Get correct price IDs based on environment
  const priceIds = useMemo(() => {
    return isTestMode() ? testPriceIds : livePriceIds
  }, [])

  const prices = pricesBySize[dogSize]

  const topperOptions = [
    {
      id: "25" as TopperOption,
      name: "25% Topper",
      description: "Perfect for adding variety to kibble",
      priceMultiplier: 0.25,
      badge: "Most Popular",
      badgeColor: "bg-green-100 text-green-800",
      price: prices["25"],
      stripePriceId: priceIds[dogSize]["25"]
    },
    {
      id: "50" as TopperOption,
      name: "50% Topper",
      description: "Half fresh, half kibble",
      priceMultiplier: 0.50,
      price: prices["50"],
      stripePriceId: priceIds[dogSize]["50"]
    },
    {
      id: "75" as TopperOption,
      name: "75% Topper",
      description: "Mostly fresh food",
      priceMultiplier: 0.75,
      price: prices["75"],
      stripePriceId: priceIds[dogSize]["75"]
    }
  ]

  const handlePurchase = async () => {
    if (!selectedOption) return

    const selectedProduct = topperOptions.find(opt => opt.id === selectedOption)
    if (!selectedProduct?.stripePriceId) return

    setIsLoading(true)

    try {
      // Create Stripe checkout session for the selected topper subscription
      const response = await fetch('/api/topper-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: selectedProduct.stripePriceId,
          dogId,
          dogName,
          dogSize: getDogSize(dogWeight),
          productType: selectedOption,
          isSubscription: true, // All topper plans are subscriptions
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Error starting topper purchase:", error)
      alert("Failed to start checkout. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Subscribe to Topper Plan</DialogTitle>
          <DialogDescription>
            Choose how much fresh food you'd like to add to {dogName}'s diet.
            <span className="block mt-1 text-xs">
              Pricing based on {dogSize.charAt(0).toUpperCase() + dogSize.slice(1)} dog size ({dogWeight} {dogWeightUnit})
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-4">
            {topperOptions.map((option) => (
              <Card
                key={option.id}
                className={`cursor-pointer transition-all ${
                  selectedOption === option.id
                    ? "ring-2 ring-primary ring-offset-2"
                    : "hover:shadow-md"
                }`}
                onClick={() => setSelectedOption(option.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedOption === option.id
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {selectedOption === option.id && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{option.name}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {option.description}
                        </CardDescription>
                      </div>
                    </div>
                    {option.badge && (
                      <Badge className={option.badgeColor || ""}>
                        {option.badge}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {option.priceMultiplier * 100}% of {dogName}'s daily nutrition from fresh food
                    </p>
                    <div className="text-right">
                      <p className="font-semibold text-lg">${option.price.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">every 2 weeks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={!selectedOption || isLoading}
              className="flex-1"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {isLoading ? "Loading..." : "Subscribe"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
