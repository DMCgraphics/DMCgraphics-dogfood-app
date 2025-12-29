/**
 * Batch Planning Configuration
 * Recipe base batch data for scaling production
 */

export interface RecipeBaseBatch {
  totalGrams: number
  totalPounds: number
  kcalPerKg: number
  ingredients: { [ingredient: string]: number }
}

export interface IngredientCategory {
  name: string
  ingredients: string[]
  color: string
  icon: string
}

// Recipe base batch data (from CSV files - 50 lb batches)
export const RECIPE_BASE_BATCHES: { [key: string]: RecipeBaseBatch } = {
  'Beef & Quinoa Harvest': {
    totalGrams: 22696.86,
    totalPounds: 50.04,
    kcalPerKg: 1146,
    ingredients: {
      'Ground beef (90% lean/10% fat)': 10205.82,
      'Quinoa, cooked': 3027.73,
      'Carrots, frozen': 2267.96,
      'Beef Heart, Raw': 1814.37,
      'Spinach, frozen': 1700.97,
      'Green peas, frozen': 1360.78,
      'Eggs, Liquid whole': 1360.78,
      'Beef Liver, Raw': 680.39,
      'Cod Liver Oil': 95.25,
      'Calcium Carbonate 38%': 85,
      'Kelp, Rockweed': 30,
      'Dicalcium Phosphate': 25,
      'Sodium Chloride': 15.995,
      'Beta Glucans + MOS': 15.6,
      'Magnesium Proteinate 10%': 6,
      'Zinc Proteinate 15%': 3,
      'Vitamin E 700D': 2,
      'Manganese Proteinate 15%': 0.2,
      'Thiamine Mononitrate B1': 0.03,
    }
  },
  'Lamb & Pumpkin Feast': {
    totalGrams: 22694.60,
    totalPounds: 50.03,
    kcalPerKg: 1206,
    ingredients: {
      'Lamb, Ground 85/15': 6350.29,
      'Lamb Heart, Raw': 6236.89,
      'Pumpkin, Canned': 2948.35,
      'Kale, frozen': 1814.37,
      'Green peas, frozen': 1587.57,
      'Apple, Honeycrisp, Diced IQF': 1587.57,
      'Eggs, Liquid whole': 1360.78,
      'Lamb Liver, Raw': 544.31,
      'Cod Liver Oil': 81.65,
      'Calcium Carbonate 38%': 85,
      'Kelp, Rockweed': 30,
      'Dicalcium Phosphate': 25,
      'Sodium Chloride': 15.995,
      'Beta Glucans + MOS': 15.6,
      'Magnesium Proteinate 10%': 6,
      'Zinc Proteinate 15%': 3,
      'Vitamin E 700D': 2,
      'Manganese Proteinate 15%': 0.2,
      'Thiamine Mononitrate B1': 0.03,
    }
  },
  'Chicken & Garden Veggie': {
    totalGrams: 22700,
    totalPounds: 50,
    kcalPerKg: 1100,
    ingredients: {
      'Ground chicken': 10000,
      'Eggs, Liquid whole': 1360,
      'White rice, cooked': 3000,
      'Carrots, frozen': 2500,
      'Spinach, frozen': 1800,
      'Blueberries': 1500,
      'Calcium Carbonate 38%': 85,
      'Kelp, Rockweed': 30,
      'Dicalcium Phosphate': 25,
      'Sodium Chloride': 15.995,
      'Beta Glucans + MOS': 15.6,
      'Magnesium Proteinate 10%': 6,
      'Zinc Proteinate 15%': 3,
      'Vitamin E 700D': 2,
      'Manganese Proteinate 15%': 0.2,
      'Thiamine Mononitrate B1': 0.03,
    }
  },
  'Turkey & Brown Rice Comfort': {
    totalGrams: 22700,
    totalPounds: 50,
    kcalPerKg: 1150,
    ingredients: {
      'Ground turkey': 10000,
      'Eggs, Liquid whole': 1360,
      'Brown rice, cooked': 3000,
      'Carrots, frozen': 2500,
      'Zucchini': 2000,
      'Spinach, frozen': 1500,
      'Cod Liver Oil': 85,
      'Calcium Carbonate 38%': 85,
      'Kelp, Rockweed': 30,
      'Dicalcium Phosphate': 25,
      'Sodium Chloride': 15.995,
      'Beta Glucans + MOS': 15.6,
      'Magnesium Proteinate 10%': 6,
      'Zinc Proteinate 15%': 3,
      'Vitamin E 700D': 2,
      'Manganese Proteinate 15%': 0.2,
      'Thiamine Mononitrate B1': 0.03,
    }
  }
}

// Pack size configuration
export const PACK_SIZE_OZ = 12
export const PACK_SIZE_G = PACK_SIZE_OZ * 28.3495 // 340.19g per pack

// Buffer for waste and testing
export const WASTE_BUFFER = 1.1 // 10% buffer

// Ingredient categories for organization
export const INGREDIENT_CATEGORIES: IngredientCategory[] = [
  {
    name: 'Proteins',
    color: 'red',
    icon: '🥩',
    ingredients: [
      'Ground beef (90% lean/10% fat)',
      'Beef Heart, Raw',
      'Beef Liver, Raw',
      'Lamb, Ground 85/15',
      'Lamb Heart, Raw',
      'Lamb Liver, Raw',
      'Ground chicken',
      'Ground turkey',
      'Eggs, Liquid whole',
    ]
  },
  {
    name: 'Vegetables & Fruits',
    color: 'green',
    icon: '🥬',
    ingredients: [
      'Carrots, frozen',
      'Spinach, frozen',
      'Green peas, frozen',
      'Kale, frozen',
      'Pumpkin, Canned',
      'Apple, Honeycrisp, Diced IQF',
      'Zucchini',
      'Blueberries',
    ]
  },
  {
    name: 'Grains',
    color: 'amber',
    icon: '🌾',
    ingredients: [
      'Quinoa, cooked',
      'Brown rice, cooked',
      'White rice, cooked',
    ]
  },
  {
    name: 'Oils',
    color: 'yellow',
    icon: '🧴',
    ingredients: [
      'Cod Liver Oil',
    ]
  },
  {
    name: 'Animix Premix',
    color: 'purple',
    icon: '💊',
    ingredients: [
      'Calcium Carbonate 38%',
      'Kelp, Rockweed',
      'Dicalcium Phosphate',
      'Sodium Chloride',
      'Beta Glucans + MOS',
      'Magnesium Proteinate 10%',
      'Zinc Proteinate 15%',
      'Vitamin E 700D',
      'Manganese Proteinate 15%',
      'Thiamine Mononitrate B1',
    ]
  }
]

export function getIngredientCategory(ingredient: string): IngredientCategory {
  for (const category of INGREDIENT_CATEGORIES) {
    if (category.ingredients.includes(ingredient)) {
      return category
    }
  }
  return INGREDIENT_CATEGORIES[0] // Default to first category
}

export function formatWeight(grams: number): string {
  const lbs = (grams / 453.592).toFixed(2)
  const kg = (grams / 1000).toFixed(2)
  return `${grams.toFixed(0)}g (${lbs} lbs / ${kg} kg)`
}
