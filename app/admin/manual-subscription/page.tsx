"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle } from "lucide-react"

interface Recipe {
  id: string
  name: string
  slug: string
}

export default function ManualSubscriptionPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const [formData, setFormData] = useState({
    customerEmail: "",
    customerName: "",
    dogName: "",
    dogWeightLbs: "",
    dogAge: "",
    dogActivityLevel: "moderate",
    planType: "full",
    topperPercentage: 50,
    selectedRecipes: [] as string[],
  })

  useEffect(() => {
    loadRecipes()
  }, [])

  async function loadRecipes() {
    try {
      const response = await fetch("/api/recipes")
      if (response.ok) {
        const data = await response.json()
        setRecipes(data.filter((r: Recipe) => !r.slug.includes("coming-soon")))
      }
    } catch (error) {
      console.error("Error loading recipes:", error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    if (formData.selectedRecipes.length === 0) {
      setResult({
        success: false,
        message: "Please select at least one recipe"
      })
      setLoading(false)
      return
    }

    const selectedRecipeData = formData.selectedRecipes.map(recipeId => {
      const recipe = recipes.find(r => r.id === recipeId)
      return {
        recipeId,
        recipeName: recipe?.name || ""
      }
    })

    try {
      const response = await fetch("/api/admin/manual-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: formData.customerEmail,
          customerName: formData.customerName,
          dogName: formData.dogName,
          dogWeightLbs: parseFloat(formData.dogWeightLbs),
          dogAge: formData.dogAge,
          dogActivityLevel: formData.dogActivityLevel,
          planType: formData.planType,
          topperPercentage: formData.planType === 'topper' ? formData.topperPercentage : undefined,
          recipes: selectedRecipeData,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const recipeDetails = data.planItems.map((item: any) =>
          `${item.recipe}: ${item.biweekly_grams}g`
        ).join(', ')

        setResult({
          success: true,
          message: `Successfully added ${formData.planType === 'topper' ? `${formData.topperPercentage}% topper` : 'full meal'} subscription for ${formData.dogName}! ${recipeDetails}`
        })
        // Reset form
        setFormData({
          customerEmail: "",
          customerName: "",
          dogName: "",
          dogWeightLbs: "",
          dogAge: "",
          dogActivityLevel: "moderate",
          planType: "full",
          topperPercentage: 50,
          selectedRecipes: [],
        })
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to create subscription"
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: "An error occurred while creating the subscription"
      })
    } finally {
      setLoading(false)
    }
  }

  function toggleRecipe(recipeId: string) {
    setFormData(prev => ({
      ...prev,
      selectedRecipes: prev.selectedRecipes.includes(recipeId)
        ? prev.selectedRecipes.filter(id => id !== recipeId)
        : [...prev.selectedRecipes, recipeId]
    }))
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Manual Subscription Entry</h1>
        <p className="text-muted-foreground">
          Add subscriptions for customers who paid via Stripe but haven't claimed online
        </p>
      </div>

      {result && (
        <Alert className={`mb-6 ${result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          {result.success ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
          <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
            {result.message}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Customer & Dog Information</CardTitle>
          <CardDescription>Enter the subscription details from Stripe</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  required
                  placeholder="John Smith"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerEmail">Customer Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  required
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dogName">Dog Name</Label>
                <Input
                  id="dogName"
                  value={formData.dogName}
                  onChange={(e) => setFormData({ ...formData, dogName: e.target.value })}
                  required
                  placeholder="Buddy"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dogWeightLbs">Dog Weight (lbs)</Label>
                <Input
                  id="dogWeightLbs"
                  type="number"
                  step="0.1"
                  value={formData.dogWeightLbs}
                  onChange={(e) => setFormData({ ...formData, dogWeightLbs: e.target.value })}
                  required
                  placeholder="45"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dogAge">Dog Age</Label>
                <Input
                  id="dogAge"
                  value={formData.dogAge}
                  onChange={(e) => setFormData({ ...formData, dogAge: e.target.value })}
                  placeholder="3 yrs (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dogActivityLevel">Activity Level</Label>
                <Select
                  value={formData.dogActivityLevel}
                  onValueChange={(value) => setFormData({ ...formData, dogActivityLevel: value })}
                >
                  <SelectTrigger id="dogActivityLevel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Plan Type</Label>
              <RadioGroup
                value={formData.planType}
                onValueChange={(value: 'full' | 'topper') => setFormData({ ...formData, planType: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full" className="font-normal cursor-pointer">Full Meal Plan (100%)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="topper" id="topper" />
                  <Label htmlFor="topper" className="font-normal cursor-pointer">Topper Plan</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.planType === 'topper' && (
              <div className="space-y-2">
                <Label htmlFor="topperPercentage">Topper Percentage</Label>
                <Select
                  value={formData.topperPercentage.toString()}
                  onValueChange={(value) => setFormData({ ...formData, topperPercentage: parseInt(value) as 25 | 50 | 75 })}
                >
                  <SelectTrigger id="topperPercentage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                    <SelectItem value="75">75%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Recipes (Select one or more)</Label>
              <div className="space-y-2 border rounded-lg p-4">
                {recipes.map((recipe) => (
                  <div key={recipe.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={recipe.id}
                      checked={formData.selectedRecipes.includes(recipe.id)}
                      onCheckedChange={() => toggleRecipe(recipe.id)}
                    />
                    <Label
                      htmlFor={recipe.id}
                      className="font-normal cursor-pointer flex-1"
                    >
                      {recipe.name}
                    </Label>
                  </div>
                ))}
              </div>
              {formData.selectedRecipes.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formData.selectedRecipes.length} recipe{formData.selectedRecipes.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating Subscription..." : "Create Subscription"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
