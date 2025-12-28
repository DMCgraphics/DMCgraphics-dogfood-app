"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Download, Printer, Save, RefreshCw, ChevronLeft, ChevronRight, Calendar as CalendarToday, Pencil } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { BatchPlanResponse, RecipeRequirement, ConsolidatedIngredient, DogSubscription } from "@/app/api/admin/batch-planning/route"
import { EditDogBatchDialog } from "@/components/admin/edit-dog-batch-dialog"

/**
 * Calculate the next cook date based on bi-weekly schedule starting Jan 8, 2026
 * Cook dates are every 2 weeks: Jan 8, Jan 22, Feb 5, Feb 19, etc.
 */
function getNextCookDate(): Date {
  const today = new Date()
  // First cook date: January 8, 2026 at noon UTC (avoids timezone issues)
  const firstCookDate = new Date('2026-01-08T12:00:00Z')

  // If today is before the first cook date, return first cook date
  if (today < firstCookDate) {
    return firstCookDate
  }

  // Calculate how many days since the first cook date
  const daysSinceFirst = Math.floor((today.getTime() - firstCookDate.getTime()) / (1000 * 60 * 60 * 24))

  // Calculate how many complete 2-week cycles have passed
  const cyclesPassed = Math.floor(daysSinceFirst / 14)

  // Calculate the next cook date
  const nextCookDate = new Date(firstCookDate)
  nextCookDate.setDate(firstCookDate.getDate() + (cyclesPassed * 14))

  // If we're past that date, add another 2 weeks
  if (nextCookDate < today) {
    nextCookDate.setDate(nextCookDate.getDate() + 14)
  }

  return nextCookDate
}

export default function BatchPlanningPage() {
  const [batchDate, setBatchDate] = useState<Date>(getNextCookDate())
  const [batchPlan, setBatchPlan] = useState<BatchPlanResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [customerFilter, setCustomerFilter] = useState<'production' | 'test' | 'all'>('production')
  const [editingDog, setEditingDog] = useState<DogSubscription | null>(null)

  useEffect(() => {
    loadBatchPlan()
  }, [batchDate, customerFilter])

  async function loadBatchPlan() {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/batch-planning?date=${batchDate.toISOString().split('T')[0]}&filter=${customerFilter}`)
      if (response.ok) {
        const data = await response.json()
        setBatchPlan(data)
      }
    } catch (error) {
      console.error("Error loading batch plan:", error)
    } finally {
      setLoading(false)
    }
  }

  async function saveBatchPlan() {
    if (!batchPlan) return

    setSaving(true)
    try {
      const response = await fetch("/api/admin/batch-planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchDate: batchPlan.batchDate,
          recipeRequirements: batchPlan.recipeRequirements,
          consolidatedIngredients: batchPlan.consolidatedIngredients,
          notes,
        }),
      })

      if (response.ok) {
        alert("Batch plan saved successfully!")
      }
    } catch (error) {
      console.error("Error saving batch plan:", error)
      alert("Failed to save batch plan")
    } finally {
      setSaving(false)
    }
  }

  function printBatchPlan() {
    window.print()
  }

  function exportToCsv() {
    if (!batchPlan) return

    let csv = "Ingredient,Grams,Pounds,Kilograms,Category\n"
    for (const item of batchPlan.consolidatedIngredients) {
      csv += `"${item.ingredient}",${item.grams.toFixed(2)},${item.pounds.toFixed(2)},${item.kg.toFixed(2)},"${item.category}"\n`
    }

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `batch-plan-${batchPlan.batchDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  function goToPreviousCookDate() {
    const newDate = new Date(batchDate)
    newDate.setDate(newDate.getDate() - 14) // 2 weeks back
    setBatchDate(newDate)
  }

  function goToNextCookDate() {
    const newDate = new Date(batchDate)
    newDate.setDate(newDate.getDate() + 14) // 2 weeks forward
    setBatchDate(newDate)
  }

  function goToToday() {
    setBatchDate(getNextCookDate())
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      {/* Header - stacks on mobile */}
      <div className="mb-6 print:hidden">
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Batch Planning</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Calculate ingredient requirements for upcoming production batches
          </p>
        </div>

        {/* Controls - stack on mobile, horizontal on desktop */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Customer filter - full width on mobile */}
          <Select value={customerFilter} onValueChange={(value: 'production' | 'test' | 'all') => setCustomerFilter(value)}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="production">Production</SelectItem>
              <SelectItem value="test">Test Only</SelectItem>
              <SelectItem value="all">All Customers</SelectItem>
            </SelectContent>
          </Select>

          {/* Date controls - flex wrap on mobile */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousCookDate} title="Previous cook date (2 weeks back)">
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[200px] sm:w-[240px] justify-start text-left font-normal text-sm sm:text-base")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(batchDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={batchDate}
                    onSelect={(date) => date && setBatchDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button variant="outline" size="icon" onClick={goToNextCookDate} title="Next cook date (2 weeks forward)">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="outline" onClick={goToToday} className="text-sm sm:text-base">
              <CalendarToday className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Next Cook</span>
              <span className="sm:hidden">Next</span>
            </Button>

            <Button variant="outline" onClick={loadBatchPlan} disabled={loading} className="text-sm sm:text-base">
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-4 text-muted-foreground">Calculating batch requirements...</p>
        </div>
      ) : batchPlan ? (
        <>
          {/* Print Header */}
          <div className="hidden print:block mb-6">
            <h1 className="text-2xl font-bold">NouriPet Batch Plan - {format(new Date(batchPlan.batchDate), "PPP")}</h1>
            <p className="text-sm text-gray-600 mt-2">Generated: {format(new Date(), "PPP")}</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Cook Date</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{format(new Date(batchPlan.batchDate + 'T12:00:00'), "MMM d, yyyy")}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Packs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{batchPlan.totalPacks.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">12oz packs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Weight</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
                  {(batchPlan.recipeRequirements.reduce((sum, req) => sum + req.totalPoundsNeeded, 0)).toFixed(1)} lbs
                </div>
                <p className="text-xs text-muted-foreground mt-1">with 10% buffer</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Order By</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{format(new Date(batchPlan.orderByDate), "MMM d")}</div>
                <p className="text-xs text-muted-foreground mt-1">2 weeks before</p>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-6 print:hidden">
            <Button onClick={saveBatchPlan} disabled={saving} className="text-sm sm:text-base">
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Plan"}
            </Button>
            <Button variant="outline" onClick={printBatchPlan} className="text-sm sm:text-base">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" onClick={exportToCsv} className="text-sm sm:text-base">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Dog Subscriptions */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Dogs & Customers</CardTitle>
              <CardDescription>Cooking for {batchPlan.dogSubscriptions.length} {batchPlan.dogSubscriptions.length === 1 ? 'dog' : 'dogs'} this batch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {batchPlan.dogSubscriptions.map((dog) => (
                  <div key={dog.dogId} className="border rounded-lg p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-base sm:text-lg truncate">{dog.dogName}</h3>
                          <p className="text-sm text-muted-foreground truncate">{dog.customerName}</p>
                          <p className="text-xs text-muted-foreground truncate">{dog.customerEmail}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 print:hidden"
                          onClick={() => setEditingDog(dog)}
                          title="Edit dog and meal plan"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                      <Badge variant="secondary" className="text-xs sm:text-sm shrink-0">
                        {dog.totalBiweeklyPacks} packs
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs sm:text-sm mb-3">
                      <div>
                        <div className="text-muted-foreground text-xs">Weight</div>
                        <div className="font-medium">{dog.dogWeightLbs.toFixed(1)} lbs ({dog.dogWeightKg.toFixed(1)} kg)</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Activity</div>
                        <div className="font-medium capitalize">{dog.activityLevel}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Total Amount</div>
                        <div className="font-medium">{(dog.totalBiweeklyGrams / 453.592).toFixed(1)} lbs</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Recipes</div>
                        <div className="font-medium">{dog.recipes.length}</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {dog.recipes.map((recipe, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm bg-muted/50 px-3 py-1.5 rounded">
                          <span className="font-medium">{recipe.recipeName}</span>
                          <span className="text-muted-foreground text-xs sm:text-sm">{recipe.biweeklyPacks} packs ({(recipe.biweeklyGrams / 453.592).toFixed(1)} lbs)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recipe Requirements */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Recipe Requirements</CardTitle>
              <CardDescription>Production breakdown by recipe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {batchPlan.recipeRequirements.map((req) => (
                  <div key={req.recipe} className="border rounded-lg p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-base sm:text-lg">{req.recipe}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {req.totalPoundsNeeded.toFixed(1)} lbs total (with 10% buffer)
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs sm:text-sm shrink-0">
                        {req.numberOfPacks} packs
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs sm:text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs">Total Needed</div>
                        <div className="font-medium">{req.totalGramsNeeded.toLocaleString()}g</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">With Buffer</div>
                        <div className="font-medium">{req.totalPoundsNeeded.toFixed(1)} lbs</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Scale Factor</div>
                        <div className="font-medium">{req.batchScaleFactor.toFixed(2)}x</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Packs (12oz)</div>
                        <div className="font-medium">{req.numberOfPacks}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Shopping List */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Shopping List</CardTitle>
              <CardDescription>Consolidated ingredient requirements for all recipes</CardDescription>
            </CardHeader>
            <CardContent>
              <ShoppingList ingredients={batchPlan.consolidatedIngredients} />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Add any special instructions or notes for this batch</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No batch plan available. Select a date to calculate.</p>
        </div>
      )}

      {/* Edit Dog Dialog */}
      {editingDog && (
        <EditDogBatchDialog
          open={!!editingDog}
          onOpenChange={(open) => !open && setEditingDog(null)}
          dogData={editingDog}
          onSuccess={() => {
            setEditingDog(null)
            loadBatchPlan()
          }}
        />
      )}
    </div>
  )
}

function ShoppingList({ ingredients }: { ingredients: ConsolidatedIngredient[] }) {
  // Group by category
  const grouped: { [category: string]: ConsolidatedIngredient[] } = {}
  for (const item of ingredients) {
    if (!grouped[item.category]) {
      grouped[item.category] = []
    }
    grouped[item.category].push(item)
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h3 className="font-semibold text-base sm:text-lg mb-3 flex flex-wrap items-center gap-2">
            <span>{items[0].categoryIcon}</span>
            <span>{category}</span>
            <Badge variant="outline" className="text-xs">{items.length} items</Badge>
          </h3>
          <div className="space-y-2">
            {items.map((item) => {
              // Check if this is an egg ingredient
              const isEgg = item.ingredient.toLowerCase().includes('egg')
              const eggCount = isEgg ? Math.ceil(item.grams / 50) : null // 1 large egg ≈ 50g

              return (
                <div key={item.ingredient} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 py-2 border-b last:border-0">
                  <div className="flex-1">
                    <div className="font-medium text-sm sm:text-base">{item.ingredient}</div>
                    {eggCount && (
                      <div className="text-xs text-muted-foreground mt-1">
                        ≈ {eggCount} whole {eggCount === 1 ? 'egg' : 'eggs'}
                      </div>
                    )}
                  </div>
                  <div className="sm:text-right">
                    <div className="font-mono text-sm">
                      {item.grams.toFixed(0)}g
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.pounds.toFixed(1)} lbs / {item.kg.toFixed(1)} kg
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <Separator className="mt-4" />
        </div>
      ))}
    </div>
  )
}
