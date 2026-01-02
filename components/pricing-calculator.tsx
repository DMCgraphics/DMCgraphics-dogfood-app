"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Calculator, ArrowRight, Check } from "lucide-react"
import Link from "next/link"
import { LimitedSlotsNotification } from "@/components/limited-slots-notification"

export function PricingCalculator() {
  const [weight, setWeight] = useState("")
  const [unit, setUnit] = useState<"lb" | "kg">("lb")
  const [showResults, setShowResults] = useState(false)

  const calculatePricing = () => {
    if (!weight || parseFloat(weight) <= 0) return null

    const weightInLbs = unit === "kg" ? parseFloat(weight) * 2.20462 : parseFloat(weight)

    // Determine size category and pricing based on weight
    let sizeCategory = ""
    let weeklyPrice = 0
    let biweeklyPrice = 0
    let dailyGrams = 0

    if (weightInLbs <= 20) {
      sizeCategory = "Small (5-20 lbs)"
      weeklyPrice = 29
      biweeklyPrice = 58
      dailyGrams = Math.round(weightInLbs * 20) // Rough estimate
    } else if (weightInLbs <= 50) {
      sizeCategory = "Medium (21-50 lbs)"
      weeklyPrice = 47
      biweeklyPrice = 94
      dailyGrams = Math.round(weightInLbs * 18)
    } else if (weightInLbs <= 90) {
      sizeCategory = "Large (51-90 lbs)"
      weeklyPrice = 69
      biweeklyPrice = 138
      dailyGrams = Math.round(weightInLbs * 16)
    } else {
      sizeCategory = "XL (91+ lbs)"
      weeklyPrice = 87
      biweeklyPrice = 174
      dailyGrams = Math.round(weightInLbs * 15)
    }

    return {
      sizeCategory,
      weeklyPrice,
      biweeklyPrice,
      dailyGrams,
      weightInLbs: Math.round(weightInLbs),
    }
  }

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault()
    if (weight && parseFloat(weight) > 0) {
      setShowResults(true)
    }
  }

  const pricing = calculatePricing()

  return (
    <section className="section-padding bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h2 className="font-manrope text-2xl lg:text-3xl font-bold mb-4">
            See Your Dog's Custom Pricing
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get an instant estimate based on your dog's weight. Actual pricing may vary based on activity level and recipe selection.
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Calculate Your Price</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCalculate} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Dog's Weight</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="Enter weight"
                    value={weight}
                    onChange={(e) => {
                      setWeight(e.target.value)
                      setShowResults(false)
                    }}
                    min="1"
                    step="0.1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <select
                    id="unit"
                    value={unit}
                    onChange={(e) => {
                      setUnit(e.target.value as "lb" | "kg")
                      setShowResults(false)
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="lb">Pounds (lb)</option>
                    <option value="kg">Kilograms (kg)</option>
                  </select>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Calculate My Price
                <Calculator className="ml-2 h-4 w-4" />
              </Button>
            </form>

            {showResults && pricing && (
              <div className="mt-8 space-y-6 animate-in fade-in duration-500">
                {/* Limited slots notification */}
                <LimitedSlotsNotification />

                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="text-sm text-muted-foreground mb-2">Size Category</div>
                  <div className="text-xl font-bold text-primary">{pricing.sizeCategory}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Based on {pricing.weightInLbs} lbs
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-card border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-2">Biweekly Delivery</div>
                    <div className="text-3xl font-bold">${pricing.biweeklyPrice}</div>
                    <div className="text-xs text-muted-foreground mt-1">Every 2 weeks</div>
                  </div>
                  <div className="p-4 bg-card border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-2">Weekly Cost</div>
                    <div className="text-3xl font-bold">${pricing.weeklyPrice}</div>
                    <div className="text-xs text-muted-foreground mt-1">Per week</div>
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="text-sm font-medium mb-3">What's Included:</div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Fresh, AAFCO-balanced meals (~{pricing.dailyGrams}g daily)</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Personalized for your dog's age, activity & health needs</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Free local delivery (Westchester NY & Fairfield CT)</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>100% satisfaction guarantee - full refund if not satisfied</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Cancel, pause, or skip anytime - no commitment</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild size="lg" className="flex-1">
                    <Link href="/plan-builder">
                      Build Your Complete Plan
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="flex-1">
                    <Link href="/recipes">
                      View Our Recipes
                    </Link>
                  </Button>
                </div>

                <div className="text-center text-xs text-muted-foreground">
                  This is an estimate. Final price depends on recipe selection, activity level, and any add-ons.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
