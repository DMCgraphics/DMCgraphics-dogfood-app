import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { RECIPE_BASE_BATCHES, PACK_SIZE_G, WASTE_BUFFER, getIngredientCategory, INGREDIENT_CATEGORIES } from "@/lib/batch-planning-config"

export interface RecipeRequirement {
  recipe: string
  totalGramsNeeded: number
  totalPoundsNeeded: number
  numberOfPacks: number
  batchScaleFactor: number
  numberOfBatches: number
  ingredientRequirements: { [ingredient: string]: number }
}

export interface ConsolidatedIngredient {
  ingredient: string
  grams: number
  pounds: number
  kg: number
  category: string
  categoryIcon: string
  categoryColor: string
}

export interface BatchPlanResponse {
  batchDate: string
  recipeRequirements: RecipeRequirement[]
  consolidatedIngredients: ConsolidatedIngredient[]
  totalPacks: number
  totalBatches: number
  orderByDate: string
  deliveryByDate: string
}

/**
 * GET /api/admin/batch-planning
 * Calculate batch requirements for a specific date or next upcoming batch
 */
export async function GET(request: Request) {
  const supabase = await createClient()

  // Check admin access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Get batch date from query params
  const { searchParams } = new URL(request.url)
  const batchDateParam = searchParams.get("date")

  let batchDate: Date
  if (batchDateParam) {
    batchDate = new Date(batchDateParam)
  } else {
    // Default to next cook date (bi-weekly schedule starting Jan 8, 2026)
    batchDate = getNextCookDate()
  }

  // Get all active plans first
  // Note: Including "checkout_in_progress" for dev testing - remove in production
  const { data: activePlans, error: plansError } = await supabase
    .from("plans")
    .select("id")
    .in("status", ["active", "purchased", "checkout_in_progress"])

  if (plansError) {
    console.error("Error fetching plans:", plansError)
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 })
  }

  const activePlanIds = activePlans?.map(p => p.id) || []

  if (activePlanIds.length === 0) {
    // No active plans, return empty response
    return NextResponse.json({
      batchDate: batchDate.toISOString().split('T')[0],
      recipeRequirements: [],
      consolidatedIngredients: [],
      totalPacks: 0,
      totalBatches: 0,
      orderByDate: new Date(batchDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryByDate: new Date(batchDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })
  }

  // Get plan items for active plans
  const { data: planItems, error } = await supabase
    .from("plan_items")
    .select(`
      qty,
      size_g,
      recipe_id,
      dog_id,
      plan_id,
      recipes:recipe_id (
        id,
        name,
        slug,
        kcal_per_100g
      ),
      dogs:dog_id (
        id,
        name,
        weight_kg,
        activity_level
      )
    `)
    .in("plan_id", activePlanIds)

  if (error) {
    console.error("Error fetching plan items:", error)
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
  }

  console.log(`[BATCH PLANNING] Found ${activePlanIds.length} active plans, ${planItems?.length || 0} plan items`)

  // Calculate requirements
  const recipeRequirements = calculateBatchRequirements(planItems)
  const consolidatedIngredients = consolidateIngredients(recipeRequirements)

  // Calculate totals
  const totalPacks = recipeRequirements.reduce((sum, req) => sum + req.numberOfPacks, 0)
  const totalBatches = recipeRequirements.reduce((sum, req) => sum + req.numberOfBatches, 0)

  // Calculate ordering timeline
  const orderByDate = new Date(batchDate)
  orderByDate.setDate(orderByDate.getDate() - 14) // 2 weeks before

  const deliveryByDate = new Date(batchDate)
  deliveryByDate.setDate(deliveryByDate.getDate() - 2) // 2 days before

  const response: BatchPlanResponse = {
    batchDate: batchDate.toISOString().split('T')[0],
    recipeRequirements,
    consolidatedIngredients,
    totalPacks,
    totalBatches,
    orderByDate: orderByDate.toISOString().split('T')[0],
    deliveryByDate: deliveryByDate.toISOString().split('T')[0],
  }

  return NextResponse.json(response)
}

/**
 * POST /api/admin/batch-planning
 * Save a batch schedule
 */
export async function POST(request: Request) {
  const supabase = await createClient()

  // Check admin access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { batchDate, recipeRequirements, consolidatedIngredients, notes } = body

  // Check if batch schedule already exists
  const { data: existing } = await supabase
    .from("batch_schedules")
    .select("id")
    .eq("batch_date", batchDate)
    .single()

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from("batch_schedules")
      .update({
        recipes_planned: recipeRequirements,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating batch schedule:", error)
      return NextResponse.json({ error: "Failed to update batch schedule" }, { status: 500 })
    }

    return NextResponse.json(data)
  } else {
    // Create new
    const { data, error } = await supabase
      .from("batch_schedules")
      .insert({
        batch_date: batchDate,
        recipes_planned: recipeRequirements,
        status: "upcoming",
        notes,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating batch schedule:", error)
      return NextResponse.json({ error: "Failed to create batch schedule" }, { status: 500 })
    }

    return NextResponse.json(data)
  }
}

/**
 * Calculate daily grams using standard body weight percentage formula
 * Daily food = Dog weight (kg) × 1000g × percentage
 * where percentage varies by activity level:
 * - low: 2%
 * - moderate: 2.5%
 * - high: 3%
 */
function calculateDailyGrams(weightKg: number, activityLevel: string): number {
  const weight = parseFloat(weightKg.toString())
  let percentage = 0.025 // 2.5% for moderate (default)

  if (activityLevel === 'low') percentage = 0.02 // 2%
  else if (activityLevel === 'high') percentage = 0.03 // 3%

  return weight * 1000 * percentage // Returns grams per day
}

/**
 * Calculate grams needed for 2 weeks based on body weight percentage
 */
function calculateBiweeklyGrams(weightKg: number, activityLevel: string): number {
  const dailyGrams = calculateDailyGrams(weightKg, activityLevel)
  return Math.round(dailyGrams * 14) // 14 days
}

function calculateBatchRequirements(planItems: any[]): RecipeRequirement[] {
  const recipeRequirements: { [recipe: string]: RecipeRequirement } = {}

  // Calculate total grams needed per recipe based on dog's caloric needs
  for (const item of planItems) {
    if (!item.recipes || !item.dogs) continue

    const recipeName = item.recipes.name
    const dogWeight = parseFloat(item.dogs.weight_kg)
    const dogName = item.dogs.name || 'Unknown'
    const activityLevel = item.dogs.activity_level || 'moderate'

    if (!recipeRequirements[recipeName]) {
      recipeRequirements[recipeName] = {
        recipe: recipeName,
        totalGramsNeeded: 0,
        totalPoundsNeeded: 0,
        numberOfPacks: 0,
        batchScaleFactor: 0,
        numberOfBatches: 0,
        ingredientRequirements: {}
      }
    }

    // Calculate biweekly grams needed for this dog using body weight percentage
    const dailyGrams = calculateDailyGrams(dogWeight, activityLevel)
    const biweeklyGrams = calculateBiweeklyGrams(dogWeight, activityLevel)
    const biweeklyPacks = Math.ceil(biweeklyGrams / PACK_SIZE_G)

    console.log(`[BATCH PLANNING] ${dogName} (${dogWeight}kg, ${activityLevel}):`)
    console.log(`  - Recipe: ${recipeName}`)
    console.log(`  - Daily grams: ${dailyGrams.toFixed(0)}g/day (${((dogWeight * (activityLevel === 'low' ? 2 : activityLevel === 'high' ? 3 : 2.5))).toFixed(1)}% of body weight)`)
    console.log(`  - Biweekly grams: ${biweeklyGrams}g (${(biweeklyGrams / 453.592).toFixed(2)} lbs)`)
    console.log(`  - Biweekly packs (12oz): ${biweeklyPacks} packs`)

    recipeRequirements[recipeName].totalGramsNeeded += biweeklyGrams * (item.qty || 1)
  }

  // Calculate batches needed and ingredient requirements
  const results: RecipeRequirement[] = []

  for (const [recipeName, requirement] of Object.entries(recipeRequirements)) {
    const baseBatch = RECIPE_BASE_BATCHES[recipeName]

    if (!baseBatch) {
      console.warn(`No base batch data for ${recipeName}`)
      continue
    }

    // Add buffer for waste/testing
    const totalWithBuffer = requirement.totalGramsNeeded * WASTE_BUFFER

    // Calculate scale factor (proportional scaling, not rounded)
    const scaleFactor = totalWithBuffer / baseBatch.totalGrams

    // For display: number of 50lb batches (rounded up for reference)
    const numberOfBatches = Math.ceil(scaleFactor)

    // Convert to packs
    const numberOfPacks = Math.ceil(requirement.totalGramsNeeded / PACK_SIZE_G)

    requirement.totalPoundsNeeded = totalWithBuffer / 453.592
    requirement.numberOfPacks = numberOfPacks
    requirement.batchScaleFactor = scaleFactor
    requirement.numberOfBatches = numberOfBatches

    // Calculate ingredient requirements using EXACT scale factor (not rounded batches)
    // This ensures ingredients add up to the actual amount needed
    for (const [ingredient, baseAmount] of Object.entries(baseBatch.ingredients)) {
      requirement.ingredientRequirements[ingredient] = baseAmount * scaleFactor
    }

    results.push(requirement)
  }

  return results.sort((a, b) => a.recipe.localeCompare(b.recipe))
}

function consolidateIngredients(requirements: RecipeRequirement[]): ConsolidatedIngredient[] {
  const consolidated: { [ingredient: string]: number } = {}

  for (const requirement of requirements) {
    for (const [ingredient, amount] of Object.entries(requirement.ingredientRequirements)) {
      if (!consolidated[ingredient]) {
        consolidated[ingredient] = 0
      }
      consolidated[ingredient] += amount
    }
  }

  // Get Animix Premix category ingredients
  const animixCategory = INGREDIENT_CATEGORIES.find(cat => cat.name === 'Animix Premix')
  const animixIngredients = animixCategory?.ingredients || []

  // Consolidate Animix Premix components into a single line item
  let animixTotal = 0
  const result: ConsolidatedIngredient[] = []

  for (const [ingredient, grams] of Object.entries(consolidated)) {
    const category = getIngredientCategory(ingredient)

    // If it's an Animix component, add to total instead of creating individual entry
    if (animixIngredients.includes(ingredient)) {
      animixTotal += grams
    } else {
      result.push({
        ingredient,
        grams,
        pounds: grams / 453.592,
        kg: grams / 1000,
        category: category.name,
        categoryIcon: category.icon,
        categoryColor: category.color,
      })
    }
  }

  // Add single consolidated Animix Premix line item
  if (animixTotal > 0 && animixCategory) {
    result.push({
      ingredient: 'Animix Premix (Total)',
      grams: animixTotal,
      pounds: animixTotal / 453.592,
      kg: animixTotal / 1000,
      category: animixCategory.name,
      categoryIcon: animixCategory.icon,
      categoryColor: animixCategory.color,
    })
  }

  // Sort by category, then by amount descending
  return result.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category)
    }
    return b.grams - a.grams
  })
}

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
