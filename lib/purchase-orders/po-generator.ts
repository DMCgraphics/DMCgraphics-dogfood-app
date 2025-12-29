/**
 * Purchase Order Generation Logic
 * Calculates protein requirements and generates POs for vendors
 */

import { RECIPE_BASE_BATCHES, INGREDIENT_CATEGORIES } from '@/lib/batch-planning-config'

export interface POLineItem {
  ingredientName: string
  requiredLbs: number
  orderQuantityLbs: number
  notes?: string
}

export interface POGenerationInput {
  recipeName: string
  batchMultiplier: number // 1 = single 50lb batch, 2 = double batch, etc.
  cookDate: Date
  minimumOrderLbs?: number // Default 10 lbs for Mosner
}

export interface POGenerationResult {
  lineItems: POLineItem[]
  totalLbs: number
  neededByDate: Date
  pickupDate: Date
  vendorName: string
}

/**
 * Get protein ingredients from category list
 */
export function getProteinIngredients(): string[] {
  const proteinCategory = INGREDIENT_CATEGORIES.find(cat => cat.name === 'Proteins')
  if (!proteinCategory) return []

  // Exclude eggs since they're not from Mosner
  return proteinCategory.ingredients.filter(ing =>
    !ing.toLowerCase().includes('egg')
  )
}

/**
 * Calculate required proteins for a batch plan
 */
export function calculateProteinRequirements(
  recipeName: string,
  batchMultiplier: number = 1
): POLineItem[] {
  const recipe = RECIPE_BASE_BATCHES[recipeName]
  if (!recipe) {
    throw new Error(`Recipe not found: ${recipeName}`)
  }

  const proteinIngredients = getProteinIngredients()
  const lineItems: POLineItem[] = []

  // Get all protein ingredients from the recipe
  for (const [ingredientName, gramsNeeded] of Object.entries(recipe.ingredients)) {
    if (proteinIngredients.includes(ingredientName)) {
      const requiredLbs = (gramsNeeded * batchMultiplier) / 453.592 // grams to pounds
      lineItems.push({
        ingredientName,
        requiredLbs,
        orderQuantityLbs: requiredLbs, // Will be rounded up next
      })
    }
  }

  return lineItems
}

/**
 * Round up quantities to vendor minimum order size
 */
export function roundToMinimumOrder(
  lineItems: POLineItem[],
  minimumOrderLbs: number = 10
): POLineItem[] {
  return lineItems.map(item => ({
    ...item,
    orderQuantityLbs: Math.ceil(item.requiredLbs / minimumOrderLbs) * minimumOrderLbs,
    notes: item.requiredLbs < minimumOrderLbs
      ? `Rounded up from ${item.requiredLbs.toFixed(2)} lbs to meet ${minimumOrderLbs} lb minimum`
      : undefined
  }))
}

/**
 * Calculate lead time dates
 */
export function calculateDates(cookDate: Date, leadTimeDays: number = 2): {
  neededByDate: Date
  pickupDate: Date
} {
  const neededByDate = new Date(cookDate)
  neededByDate.setDate(neededByDate.getDate() - 1) // Day before cook

  const pickupDate = new Date(cookDate)
  pickupDate.setDate(pickupDate.getDate() - leadTimeDays) // 2 days before cook

  return { neededByDate, pickupDate }
}

/**
 * Generate complete PO for Mosner Family Brands
 */
export function generateMosnerPO(input: POGenerationInput): POGenerationResult {
  // Calculate protein requirements
  let lineItems = calculateProteinRequirements(input.recipeName, input.batchMultiplier)

  // Round to minimum order quantities
  const minimumOrderLbs = input.minimumOrderLbs || 10
  lineItems = roundToMinimumOrder(lineItems, minimumOrderLbs)

  // Calculate dates
  const { neededByDate, pickupDate } = calculateDates(input.cookDate)

  // Calculate total
  const totalLbs = lineItems.reduce((sum, item) => sum + item.orderQuantityLbs, 0)

  return {
    lineItems,
    totalLbs,
    neededByDate,
    pickupDate,
    vendorName: 'Mosner Family Brands',
  }
}

/**
 * Combine multiple recipes into a single PO
 * Useful when cooking multiple batches in the same week
 */
export function combinePOs(pos: POGenerationResult[]): POGenerationResult {
  if (pos.length === 0) {
    throw new Error('No POs to combine')
  }

  // Combine line items by ingredient
  const combinedItems = new Map<string, POLineItem>()

  for (const po of pos) {
    for (const item of po.lineItems) {
      const existing = combinedItems.get(item.ingredientName)
      if (existing) {
        existing.orderQuantityLbs += item.orderQuantityLbs
        existing.requiredLbs += item.requiredLbs
      } else {
        combinedItems.set(item.ingredientName, { ...item })
      }
    }
  }

  const lineItems = Array.from(combinedItems.values())
  const totalLbs = lineItems.reduce((sum, item) => sum + item.orderQuantityLbs, 0)

  // Use earliest pickup date
  const earliestPickupDate = pos.reduce((earliest, po) =>
    po.pickupDate < earliest ? po.pickupDate : earliest
  , pos[0].pickupDate)

  // Use earliest needed by date
  const earliestNeededByDate = pos.reduce((earliest, po) =>
    po.neededByDate < earliest ? po.neededByDate : earliest
  , pos[0].neededByDate)

  return {
    lineItems,
    totalLbs,
    neededByDate: earliestNeededByDate,
    pickupDate: earliestPickupDate,
    vendorName: 'Mosner Family Brands',
  }
}

/**
 * Format PO for email
 */
export function formatPOForEmail(po: POGenerationResult, poNumber: string): string {
  const formattedItems = po.lineItems
    .map(item => `  • ${item.ingredientName}: ${item.orderQuantityLbs.toFixed(1)} lbs`)
    .join('\n')

  return `
PURCHASE ORDER: ${poNumber}
Needed By: ${po.neededByDate.toLocaleDateString()}
Pickup Date: ${po.pickupDate.toLocaleDateString()}

ITEMS:
${formattedItems}

TOTAL: ${po.totalLbs.toFixed(1)} lbs

Please confirm availability.
Thank you!
  `.trim()
}
