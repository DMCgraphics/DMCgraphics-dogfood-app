/**
 * NouriPet Batch Scaling Plan Calculator
 * Calculates ingredient requirements for 1/8/25 cook based on customer subscriptions
 * Uses 12oz (340g) pack sizes and recipe scaling data from CSV files
 */

// Recipe base batch data (from CSV files - 50 lb batches)
const RECIPE_BASE_BATCHES = {
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
      // Animix premix components (all in grams)
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
      // Animix premix components (all in grams)
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
    // Using proportional ingredients based on website data
    totalGrams: 22700, // Estimated
    totalPounds: 50,
    kcalPerKg: 1100, // Estimated lower fat
    ingredients: {
      'Chicken breast': 10000, // Main protein
      'Whole egg': 1360,
      'Quinoa, cooked': 3000,
      'Carrots, frozen': 2500,
      'Spinach, frozen': 1800,
      'Green peas, frozen': 1500,
      // Animix premix components (same as others)
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
    // Using proportional ingredients based on website data
    totalGrams: 22700, // Estimated
    totalPounds: 50,
    kcalPerKg: 1150, // Estimated
    ingredients: {
      'Turkey': 10000, // Main protein
      'Whole egg': 1360,
      'Brown rice, cooked': 3000,
      'Carrots, frozen': 2500,
      'Zucchini': 2000,
      'Spinach, frozen': 1500,
      'Cod Liver Oil': 85,
      // Animix premix components (same as others)
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

// Customer subscription data (from database query)
const CUSTOMER_ORDERS = [
  // Beef & Quinoa Harvest
  { recipe: 'Beef & Quinoa Harvest', weightKg: 0.411, sizeG: 1000, count: 1 },
  { recipe: 'Beef & Quinoa Harvest', weightKg: 0.454, sizeG: 1100, count: 6 }, // 4 + 2
  { recipe: 'Beef & Quinoa Harvest', weightKg: 4.082, sizeG: 6300, count: 1 },
  { recipe: 'Beef & Quinoa Harvest', weightKg: 4.536, sizeG: 6000, count: 3 }, // 1 + 2
  { recipe: 'Beef & Quinoa Harvest', weightKg: 4.990, sizeG: 6500, count: 1 },
  { recipe: 'Beef & Quinoa Harvest', weightKg: 5.897, sizeG: 7300, count: 1 },
  { recipe: 'Beef & Quinoa Harvest', weightKg: 7.711, sizeG: 3700, count: 1 },
  { recipe: 'Beef & Quinoa Harvest', weightKg: 9.072, sizeG: 10100, count: 9 }, // 3 + 6
  { recipe: 'Beef & Quinoa Harvest', weightKg: 9.072, sizeG: 20200, count: 5 },
  { recipe: 'Beef & Quinoa Harvest', weightKg: 12.701, sizeG: 400, count: 2 },
  { recipe: 'Beef & Quinoa Harvest', weightKg: 12.701, sizeG: 13000, count: 8 },
  { recipe: 'Beef & Quinoa Harvest', weightKg: 13.608, sizeG: 13700, count: 1 },
  { recipe: 'Beef & Quinoa Harvest', weightKg: 17.237, sizeG: 16300, count: 1 },
  { recipe: 'Beef & Quinoa Harvest', weightKg: 19.958, sizeG: 36400, count: 1 },
  { recipe: 'Beef & Quinoa Harvest', weightKg: 24.948, sizeG: 43000, count: 1 },

  // Chicken & Garden Veggie
  { recipe: 'Chicken & Garden Veggie', weightKg: 0.454, sizeG: 1100, count: 3 }, // 1 + 2
  { recipe: 'Chicken & Garden Veggie', weightKg: 4.536, sizeG: 6000, count: 2 }, // 1 + 1
  { recipe: 'Chicken & Garden Veggie', weightKg: 4.536, sizeG: 6800, count: 1 },
  { recipe: 'Chicken & Garden Veggie', weightKg: 4.990, sizeG: 6500, count: 2 },
  { recipe: 'Chicken & Garden Veggie', weightKg: 5.897, sizeG: 7300, count: 1 },
  { recipe: 'Chicken & Garden Veggie', weightKg: 9.072, sizeG: 400, count: 1 },
  { recipe: 'Chicken & Garden Veggie', weightKg: 10.433, sizeG: 20200, count: 1 },

  // Lamb & Pumpkin Feast
  { recipe: 'Lamb & Pumpkin Feast', weightKg: 0.411, sizeG: 1000, count: 1 },
  { recipe: 'Lamb & Pumpkin Feast', weightKg: 0.454, sizeG: 1100, count: 6 },
  { recipe: 'Lamb & Pumpkin Feast', weightKg: 0.907, sizeG: 1800, count: 2 },
  { recipe: 'Lamb & Pumpkin Feast', weightKg: 0.907, sizeG: 2100, count: 1 },
  { recipe: 'Lamb & Pumpkin Feast', weightKg: 4.536, sizeG: 6000, count: 2 }, // 1 + 1
  { recipe: 'Lamb & Pumpkin Feast', weightKg: 4.536, sizeG: 6800, count: 1 },
  { recipe: 'Lamb & Pumpkin Feast', weightKg: 4.990, sizeG: 13000, count: 1 },
  { recipe: 'Lamb & Pumpkin Feast', weightKg: 4.990, sizeG: 6500, count: 2 },
  { recipe: 'Lamb & Pumpkin Feast', weightKg: 5.897, sizeG: 7300, count: 1 },
  { recipe: 'Lamb & Pumpkin Feast', weightKg: 9.072, sizeG: 10100, count: 1 },
  { recipe: 'Lamb & Pumpkin Feast', weightKg: 31.751, sizeG: 39200, count: 1 },
  { recipe: 'Lamb & Pumpkin Feast', weightKg: 34.019, sizeG: 41200, count: 1 },
  { recipe: 'Lamb & Pumpkin Feast', weightKg: 50.349, sizeG: 36300, count: 1 },

  // Turkey & Brown Rice Comfort
  { recipe: 'Turkey & Brown Rice Comfort', weightKg: 0.454, sizeG: 1100, count: 1 },
  { recipe: 'Turkey & Brown Rice Comfort', weightKg: 4.990, sizeG: 36300, count: 1 },
]

// Pack size - switching to 12oz packs
const PACK_SIZE_OZ = 12
const PACK_SIZE_G = PACK_SIZE_OZ * 28.3495 // 340.19g per pack

interface RecipeRequirement {
  recipe: string
  totalGramsNeeded: number
  totalPoundsNeeded: number
  numberOfPacks: number
  batchScaleFactor: number
  numberOfBatches: number
  ingredientRequirements: { [ingredient: string]: number }
}

function calculateBatchRequirements(): RecipeRequirement[] {
  const recipeRequirements: { [recipe: string]: RecipeRequirement } = {}

  // Sum up total grams needed per recipe
  for (const order of CUSTOMER_ORDERS) {
    if (!recipeRequirements[order.recipe]) {
      recipeRequirements[order.recipe] = {
        recipe: order.recipe,
        totalGramsNeeded: 0,
        totalPoundsNeeded: 0,
        numberOfPacks: 0,
        batchScaleFactor: 0,
        numberOfBatches: 0,
        ingredientRequirements: {}
      }
    }
    recipeRequirements[order.recipe].totalGramsNeeded += order.sizeG * order.count
  }

  // Calculate batches needed and ingredient requirements
  const results: RecipeRequirement[] = []

  for (const [recipeName, requirement] of Object.entries(recipeRequirements)) {
    const baseBatch = RECIPE_BASE_BATCHES[recipeName as keyof typeof RECIPE_BASE_BATCHES]

    if (!baseBatch) {
      console.warn(`No base batch data for ${recipeName}`)
      continue
    }

    // Add 10% buffer for waste/testing
    const totalWithBuffer = requirement.totalGramsNeeded * 1.1

    // Calculate scale factor (how many base batches we need)
    const scaleFactor = totalWithBuffer / baseBatch.totalGrams
    const numberOfBatches = Math.ceil(scaleFactor)

    // Convert to 12oz packs
    const numberOfPacks = Math.ceil(requirement.totalGramsNeeded / PACK_SIZE_G)

    requirement.totalPoundsNeeded = totalWithBuffer / 453.592
    requirement.numberOfPacks = numberOfPacks
    requirement.batchScaleFactor = scaleFactor
    requirement.numberOfBatches = numberOfBatches

    // Calculate ingredient requirements
    for (const [ingredient, baseAmount] of Object.entries(baseBatch.ingredients)) {
      requirement.ingredientRequirements[ingredient] = baseAmount * numberOfBatches
    }

    results.push(requirement)
  }

  return results
}

function consolidateIngredients(requirements: RecipeRequirement[]): { [ingredient: string]: number } {
  const consolidated: { [ingredient: string]: number } = {}

  for (const requirement of requirements) {
    for (const [ingredient, amount] of Object.entries(requirement.ingredientRequirements)) {
      if (!consolidated[ingredient]) {
        consolidated[ingredient] = 0
      }
      consolidated[ingredient] += amount
    }
  }

  return consolidated
}

function generateReport() {
  console.log('╔═══════════════════════════════════════════════════════════════════════╗')
  console.log('║         NouriPet Batch Scaling Plan - Cook Date: 1/8/25              ║')
  console.log('║         Pack Size: 12oz (340g) per pack                              ║')
  console.log('╚═══════════════════════════════════════════════════════════════════════╝\n')

  const requirements = calculateBatchRequirements()

  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log('RECIPE SUMMARY')
  console.log('═══════════════════════════════════════════════════════════════════════\n')

  for (const req of requirements) {
    console.log(`\n📦 ${req.recipe}`)
    console.log(`   ├─ Total needed: ${req.totalGramsNeeded.toLocaleString()}g (${req.totalPoundsNeeded.toFixed(2)} lbs)`)
    console.log(`   ├─ Number of 12oz packs: ${req.numberOfPacks} packs`)
    console.log(`   ├─ Scale factor: ${req.batchScaleFactor.toFixed(2)}x base batch`)
    console.log(`   └─ Batches to make: ${req.numberOfBatches} batch(es) of 50 lbs`)
  }

  console.log('\n\n═══════════════════════════════════════════════════════════════════════')
  console.log('CONSOLIDATED INGREDIENT SHOPPING LIST (For 1/8/25 Cook)')
  console.log('═══════════════════════════════════════════════════════════════════════\n')

  const consolidated = consolidateIngredients(requirements)

  // Group ingredients by category
  const proteins: [string, number][] = []
  const vegetables: [string, number][] = []
  const grains: [string, number][] = []
  const premix: [string, number][] = []
  const oils: [string, number][] = []

  for (const [ingredient, amount] of Object.entries(consolidated)) {
    const entry: [string, number] = [ingredient, amount]

    if (ingredient.includes('Beef') || ingredient.includes('Lamb') || ingredient.includes('Chicken') ||
        ingredient.includes('Turkey') || ingredient.includes('Liver') || ingredient.includes('Heart') ||
        ingredient.includes('Egg')) {
      proteins.push(entry)
    } else if (ingredient.includes('Carrot') || ingredient.includes('Spinach') || ingredient.includes('Peas') ||
               ingredient.includes('Kale') || ingredient.includes('Pumpkin') || ingredient.includes('Apple') ||
               ingredient.includes('Zucchini')) {
      vegetables.push(entry)
    } else if (ingredient.includes('Quinoa') || ingredient.includes('Rice') || ingredient.includes('rice')) {
      grains.push(entry)
    } else if (ingredient.includes('Oil')) {
      oils.push(entry)
    } else {
      premix.push(entry)
    }
  }

  console.log('🥩 PROTEINS:')
  for (const [ingredient, amount] of proteins) {
    const lbs = (amount / 453.592).toFixed(2)
    const kg = (amount / 1000).toFixed(2)
    console.log(`   ${ingredient.padEnd(35)} ${amount.toFixed(2)}g (${lbs} lbs / ${kg} kg)`)
  }

  console.log('\n🥬 VEGETABLES & FRUITS:')
  for (const [ingredient, amount] of vegetables) {
    const lbs = (amount / 453.592).toFixed(2)
    const kg = (amount / 1000).toFixed(2)
    console.log(`   ${ingredient.padEnd(35)} ${amount.toFixed(2)}g (${lbs} lbs / ${kg} kg)`)
  }

  console.log('\n🌾 GRAINS:')
  for (const [ingredient, amount] of grains) {
    const lbs = (amount / 453.592).toFixed(2)
    const kg = (amount / 1000).toFixed(2)
    console.log(`   ${ingredient.padEnd(35)} ${amount.toFixed(2)}g (${lbs} lbs / ${kg} kg)`)
  }

  console.log('\n🧴 OILS:')
  for (const [ingredient, amount] of oils) {
    const lbs = (amount / 453.592).toFixed(2)
    const ml = amount.toFixed(2) // Approximate: 1g ≈ 1ml for oils
    console.log(`   ${ingredient.padEnd(35)} ${amount.toFixed(2)}g (${lbs} lbs / ~${ml} ml)`)
  }

  console.log('\n💊 ANIMIX PREMIX COMPONENTS:')
  for (const [ingredient, amount] of premix) {
    const lbs = (amount / 453.592).toFixed(2)
    console.log(`   ${ingredient.padEnd(35)} ${amount.toFixed(2)}g (${lbs} lbs)`)
  }

  console.log('\n\n═══════════════════════════════════════════════════════════════════════')
  console.log('ORDERING TIMELINE')
  console.log('═══════════════════════════════════════════════════════════════════════\n')
  console.log('📅 Order by: December 25, 2024 (2 weeks before cook)')
  console.log('🚚 Delivery needed: January 6, 2025 (2 days before cook)')
  console.log('👨‍🍳 Cook date: January 8, 2025')
  console.log('📦 Pack into 12oz containers immediately after cooking')

  console.log('\n\n═══════════════════════════════════════════════════════════════════════')
  console.log('NOTES')
  console.log('═══════════════════════════════════════════════════════════════════════\n')
  console.log('• All quantities include 10% buffer for waste and testing')
  console.log('• Animix premix components should be combined according to recipe specs')
  console.log('• Switching to 12oz packs as requested (was using variable sizes before)')
  console.log('• Store ingredients at proper temperatures until cook date')
  console.log('• Cooked grains (quinoa, brown rice) weights are for COOKED amounts')
  console.log('')
}

// Run the report
generateReport()
