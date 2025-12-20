interface StripePricing {
  priceId: string
  productName: string
  amountCents: number
  interval: string
  intervalCount?: number
}

// Detect if we're in test mode or production mode based on Stripe keys
function isTestMode(): boolean {
  // Check if we're in browser (client-side)
  if (typeof window !== 'undefined') {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    return publishableKey?.startsWith('pk_test_') ?? true
  }
  // Server-side: check secret key
  const secretKey = process.env.STRIPE_SECRET_KEY
  return secretKey?.startsWith('sk_test_') ?? true
}

// PRODUCTION Stripe pricing - weekly recurring subscriptions
const STRIPE_PRICING_PRODUCTION: Record<string, StripePricing[]> = {
  "beef-quinoa-harvest": [
    {
      priceId: "price_1SKqwA0WbfuHe9kAtFwQJJpC",
      productName: "Beef & Quinoa Harvest – Small (5–20 lbs) (Weekly)",
      amountCents: 2900,
      interval: "week",
    },
    {
      priceId: "price_1SKqxh0WbfuHe9kAqrT9zev1",
      productName: "Beef & Quinoa Harvest – Medium (21–50 lbs) (Weekly)",
      amountCents: 4700,
      interval: "week",
    },
    {
      priceId: "price_1SKr010WbfuHe9kA6ici7Itt",
      productName: "Beef & Quinoa Harvest – Large (51–90 lbs) (Weekly)",
      amountCents: 6900,
      interval: "week",
    },
    {
      priceId: "price_1SKr0U0WbfuHe9kAsrwjzjAt",
      productName: "Beef & Quinoa Harvest – XL (91+ lbs) (Weekly)",
      amountCents: 8700,
      interval: "week",
    },
  ],
  "lamb-pumpkin-feast": [
    {
      priceId: "price_1SKr0w0WbfuHe9kAa0hxVCHK",
      productName: "Lamb & Pumpkin Feast – Small (5–20 lbs) (Weekly)",
      amountCents: 2900,
      interval: "week",
    },
    {
      priceId: "price_1SKr1T0WbfuHe9kA6LiBOgO3",
      productName: "Lamb & Pumpkin Feast – Medium (21–50 lbs) (Weekly)",
      amountCents: 4700,
      interval: "week",
    },
    {
      priceId: "price_1SKr1q0WbfuHe9kAsCidrsh9",
      productName: "Lamb & Pumpkin Feast – Large (51–90 lbs) (Weekly)",
      amountCents: 6900,
      interval: "week",
    },
    {
      priceId: "price_1SKr2l0WbfuHe9kAAOhmv5qP",
      productName: "Lamb & Pumpkin Feast – XL (91+ lbs) (Weekly)",
      amountCents: 8700,
      interval: "week",
    },
  ],
  "low-fat-chicken-garden-veggie": [
    {
      priceId: "price_1SKr3Y0WbfuHe9kA1wFFHqKw",
      productName: "Chicken & Garden Veggie – Small (5–20 lbs) (Weekly)",
      amountCents: 2900,
      interval: "week",
    },
    {
      priceId: "price_1SKr3x0WbfuHe9kABRfAJ5de",
      productName: "Chicken & Garden Veggie – Medium (21–50 lbs) (Weekly)",
      amountCents: 4700,
      interval: "week",
    },
    {
      priceId: "price_1SKr4a0WbfuHe9kAkiYk2ckP",
      productName: "Chicken & Garden Veggie – Large (51–90 lbs) (Weekly)",
      amountCents: 6900,
      interval: "week",
    },
    {
      priceId: "price_1SKr5Y0WbfuHe9kAn0wsixX6",
      productName: "Chicken & Garden Veggie – XL (91+ lbs) (Weekly)",
      amountCents: 8700,
      interval: "week",
    },
  ],
  "turkey-brown-rice-comfort": [
    {
      priceId: "price_1SKr690WbfuHe9kAPmGhPxBD",
      productName: "Turkey & Brown Rice Comfort – Small (5–20 lbs) (Weekly)",
      amountCents: 2900,
      interval: "week",
    },
    {
      priceId: "price_1SKr6o0WbfuHe9kA7xEryQBt",
      productName: "Turkey & Brown Rice Comfort – Medium (21–50 lbs) (Weekly)",
      amountCents: 4700,
      interval: "week",
    },
    {
      priceId: "price_1SKr770WbfuHe9kAZzxskUuo",
      productName: "Turkey & Brown Rice Comfort – Large (51–90 lbs) (Weekly)",
      amountCents: 6900,
      interval: "week",
    },
    {
      priceId: "price_1SKr7r0WbfuHe9kAkBWHICvz",
      productName: "Turkey & Brown Rice Comfort – XL (91+ lbs) (Weekly)",
      amountCents: 8700,
      interval: "week",
    },
  ],
}

// PRODUCTION Stripe pricing - biweekly (every 2 weeks) recurring subscriptions
// All Full Meal Plan recipes now use unified product (prod_THPwAHEaI8nHzC) with shared price IDs
const STRIPE_PRICING_PRODUCTION_BIWEEKLY: Record<string, StripePricing[]> = {
  "beef-quinoa-harvest": [
    {
      priceId: "price_1SSTTg0WbfuHe9kAV61mhHJq",
      productName: "Full Meal Plan – Small (5–20 lbs) (Every Two Weeks)",
      amountCents: 5800,
      interval: "week",
      intervalCount: 2,
    },
    {
      priceId: "price_1SSTTS0WbfuHe9kAF9BaE2bA",
      productName: "Full Meal Plan – Medium (21–50 lbs) (Every Two Weeks)",
      amountCents: 9400,
      interval: "week",
      intervalCount: 2,
    },
    {
      priceId: "price_1SSTTD0WbfuHe9kA5WzTgnc8",
      productName: "Full Meal Plan – Large (51–90 lbs) (Every Two Weeks)",
      amountCents: 13800,
      interval: "week",
      intervalCount: 2,
    },
    {
      priceId: "price_1SSTSv0WbfuHe9kAKV9N9wea",
      productName: "Full Meal Plan – XL (91+ lbs) (Every Two Weeks)",
      amountCents: 17400,
      interval: "week",
      intervalCount: 2,
    }
  ],
  "lamb-pumpkin-feast": [
    {
      priceId: "price_1SSTTg0WbfuHe9kAV61mhHJq",
      productName: "Full Meal Plan – Small (5–20 lbs) (Every Two Weeks)",
      amountCents: 5800,
      interval: "week",
      intervalCount: 2,
    },
    {
      priceId: "price_1SSTTS0WbfuHe9kAF9BaE2bA",
      productName: "Full Meal Plan – Medium (21–50 lbs) (Every Two Weeks)",
      amountCents: 9400,
      interval: "week",
      intervalCount: 2,
    },
    {
      priceId: "price_1SSTTD0WbfuHe9kA5WzTgnc8",
      productName: "Full Meal Plan – Large (51–90 lbs) (Every Two Weeks)",
      amountCents: 13800,
      interval: "week",
      intervalCount: 2,
    },
    {
      priceId: "price_1SSTSv0WbfuHe9kAKV9N9wea",
      productName: "Full Meal Plan – XL (91+ lbs) (Every Two Weeks)",
      amountCents: 17400,
      interval: "week",
      intervalCount: 2,
    }
  ],
  "low-fat-chicken-garden-veggie": [
    {
      priceId: "price_1SSTTg0WbfuHe9kAV61mhHJq",
      productName: "Full Meal Plan – Small (5–20 lbs) (Every Two Weeks)",
      amountCents: 5800,
      interval: "week",
      intervalCount: 2,
    },
    {
      priceId: "price_1SSTTS0WbfuHe9kAF9BaE2bA",
      productName: "Full Meal Plan – Medium (21–50 lbs) (Every Two Weeks)",
      amountCents: 9400,
      interval: "week",
      intervalCount: 2,
    },
    {
      priceId: "price_1SSTTD0WbfuHe9kA5WzTgnc8",
      productName: "Full Meal Plan – Large (51–90 lbs) (Every Two Weeks)",
      amountCents: 13800,
      interval: "week",
      intervalCount: 2,
    },
    {
      priceId: "price_1SSTSv0WbfuHe9kAKV9N9wea",
      productName: "Full Meal Plan – XL (91+ lbs) (Every Two Weeks)",
      amountCents: 17400,
      interval: "week",
      intervalCount: 2,
    }
  ],
  "turkey-brown-rice-comfort": [
    {
      priceId: "price_1SSTTg0WbfuHe9kAV61mhHJq",
      productName: "Full Meal Plan – Small (5–20 lbs) (Every Two Weeks)",
      amountCents: 5800,
      interval: "week",
      intervalCount: 2,
    },
    {
      priceId: "price_1SSTTS0WbfuHe9kAF9BaE2bA",
      productName: "Full Meal Plan – Medium (21–50 lbs) (Every Two Weeks)",
      amountCents: 9400,
      interval: "week",
      intervalCount: 2,
    },
    {
      priceId: "price_1SSTTD0WbfuHe9kA5WzTgnc8",
      productName: "Full Meal Plan – Large (51–90 lbs) (Every Two Weeks)",
      amountCents: 13800,
      interval: "week",
      intervalCount: 2,
    },
    {
      priceId: "price_1SSTSv0WbfuHe9kAKV9N9wea",
      productName: "Full Meal Plan – XL (91+ lbs) (Every Two Weeks)",
      amountCents: 17400,
      interval: "week",
      intervalCount: 2,
    }
  ],
}

// TEST MODE Stripe pricing - weekly recurring subscriptions
// These are the actual test price IDs from your Stripe test account
const STRIPE_PRICING_TEST: Record<string, StripePricing[]> = {
  "beef-quinoa-harvest": [
    {
      priceId: "price_1SOlze0R4BbWwBbfnGtRhmpr",
      productName: "Beef & Quinoa Harvest – Small (5–20 lbs) (Weekly)",
      amountCents: 2900,
      interval: "week",
    },
    {
      priceId: "price_1SOlzQ0R4BbWwBbfHXu1vnVC",
      productName: "Beef & Quinoa Harvest – Medium (21–50 lbs) (Weekly)",
      amountCents: 4700,
      interval: "week",
    },
    {
      priceId: "price_1S33yk0R4BbWwBbfKd5aOJpk",
      productName: "Beef & Quinoa Harvest – Large (51–90 lbs) (Weekly)",
      amountCents: 6900,
      interval: "week",
    },
    {
      priceId: "price_1S33zx0R4BbWwBbf1AC8sUHf",
      productName: "Beef & Quinoa Harvest – XL (91+ lbs) (Weekly)",
      amountCents: 8700,
      interval: "week",
    },
  ],
  "lamb-pumpkin-feast": [
    {
      priceId: "price_1SOlxL0R4BbWwBbfFfZJAx0A",
      productName: "Lamb & Pumpkin Feast – Small (5–20 lbs) (Weekly)",
      amountCents: 2900,
      interval: "week",
    },
    {
      priceId: "price_1SOlx40R4BbWwBbfsBTtag7d",
      productName: "Lamb & Pumpkin Feast – Medium (21–50 lbs) (Weekly)",
      amountCents: 4700,
      interval: "week",
    },
    {
      priceId: "price_1SOlwj0R4BbWwBbfVVtzIQCO",
      productName: "Lamb & Pumpkin Feast – Large (51–90 lbs) (Weekly)",
      amountCents: 6900,
      interval: "week",
    },
    {
      priceId: "price_1S348p0R4BbWwBbfHoE8iLIi",
      productName: "Lamb & Pumpkin Feast – XL (91+ lbs) (Weekly)",
      amountCents: 8700,
      interval: "week",
    },
  ],
  "low-fat-chicken-garden-veggie": [
    {
      priceId: "price_1SOlyb0R4BbWwBbfElVciayU",
      productName: "Chicken & Garden Veggie – Small (5–20 lbs) (Weekly)",
      amountCents: 2900,
      interval: "week",
    },
    {
      priceId: "price_1SOlyG0R4BbWwBbfFa0nVZOH",
      productName: "Chicken & Garden Veggie – Medium (21–50 lbs) (Weekly)",
      amountCents: 4700,
      interval: "week",
    },
    {
      priceId: "price_1SOlxy0R4BbWwBbflsEWYE34",
      productName: "Chicken & Garden Veggie – Large (51–90 lbs) (Weekly)",
      amountCents: 6900,
      interval: "week",
    },
    {
      priceId: "price_1S343o0R4BbWwBbf5RVMEC8L",
      productName: "Chicken & Garden Veggie – XL (91+ lbs) (Weekly)",
      amountCents: 8700,
      interval: "week",
    },
  ],
  "turkey-brown-rice-comfort": [
    {
      priceId: "price_1SOlvp0R4BbWwBbfa5xkLVd9",
      productName: "Turkey & Brown Rice Comfort – Small (5–20 lbs) (Weekly)",
      amountCents: 2900,
      interval: "week",
    },
    {
      priceId: "price_1SOlvT0R4BbWwBbfPgFG1MH9",
      productName: "Turkey & Brown Rice Comfort – Medium (21–50 lbs) (Weekly)",
      amountCents: 4700,
      interval: "week",
    },
    {
      priceId: "price_1S8kuf0R4BbWwBbfRB6gwhiA",
      productName: "Turkey & Brown Rice Comfort – Large (51–90 lbs) (Weekly)",
      amountCents: 6900,
      interval: "week",
    },
    {
      priceId: "price_1S8kww0R4BbWwBbfGsB8CiwP",
      productName: "Turkey & Brown Rice Comfort – XL (91+ lbs) (Weekly)",
      amountCents: 8700,
      interval: "week",
    },
  ],
}

// TEST MODE Stripe pricing - biweekly (every 2 weeks) recurring subscriptions
const STRIPE_PRICING_TEST_BIWEEKLY: Record<string, StripePricing[]> = {
  "beef-quinoa-harvest": [
    {
      priceId: "price_1SOlze0R4BbWwBbfnGtRhmpr",
      productName: "Beef & Quinoa Harvest – Small (5–20 lbs) (Every Two Weeks)",
      amountCents: 5800,
      interval: "week",
      intervalCount: 2,
    },
    {
      priceId: "price_1SOlzQ0R4BbWwBbfHXu1vnVC",
      productName: "Beef & Quinoa Harvest – Medium (21–50 lbs) (Every Two Weeks)",
      amountCents: 9400,
      interval: "week",
      intervalCount: 2,
    },
    {
      priceId: "price_1S33yk0R4BbWwBbfKd5aOJpk",
      productName: "Beef & Quinoa Harvest – Large (51–90 lbs) (Every Two Weeks)",
      amountCents: 13800,
      interval: "week",
      intervalCount: 2,
    },
    {
      priceId: "price_1S33zx0R4BbWwBbf1AC8sUHf",
      productName: "Beef & Quinoa Harvest – XL (91+ lbs) (Every Two Weeks)",
      amountCents: 17400,
      interval: "week",
      intervalCount: 2,
    }
  ],
  "lamb-pumpkin-feast": [
    {
      priceId: "price_1SRg1U0R4BbWwBbfjVHM4nam",
      productName: "Lamb & Pumpkin Feast – Small (5–20 lbs) (Every Two Weeks)",
      amountCents: 5800,
      interval: "week",
      intervalCount: 2,
    },
    {
      priceId: "price_1SOlx40R4BbWwBbfsBTtag7d",
      productName: "Lamb & Pumpkin Feast – Medium (21–50 lbs) (Every Two Weeks)",
      amountCents: 9400,
      interval: "week",
      intervalCount: 2,
    },
    {
      priceId: "price_1SOlwj0R4BbWwBbfVVtzIQCO",
      productName: "Lamb & Pumpkin Feast – Large (51–90 lbs) (Every Two Weeks)",
      amountCents: 13800,
      interval: "week",
      intervalCount: 2,
    },
    {
      priceId: "price_1S348p0R4BbWwBbfHoE8iLIi",
      productName: "Lamb & Pumpkin Feast – XL (91+ lbs) (Every Two Weeks)",
      amountCents: 17400,
      interval: "week",
      intervalCount: 2,
    }
  ],
  "low-fat-chicken-garden-veggie": [
    {
      priceId: "price_1SOlyb0R4BbWwBbfElVciayU",
      productName: "Chicken & Garden Veggie – Small (5–20 lbs) (Every Two Weeks)",
      amountCents: 5800,
      interval: "week",
      intervalCount: 2,
    },
    {
      priceId: "price_1SOlyG0R4BbWwBbfFa0nVZOH",
      productName: "Chicken & Garden Veggie – Medium (21–50 lbs) (Every Two Weeks)",
      amountCents: 9400,
      interval: "week",
      intervalCount: 2,
    },
    {
      priceId: "price_1SOlxy0R4BbWwBbflsEWYE34",
      productName: "Chicken & Garden Veggie – Large (51–90 lbs) (Every Two Weeks)",
      amountCents: 13800,
      interval: "week",
      intervalCount: 2,
    },
    {
      priceId: "price_1S343o0R4BbWwBbf5RVMEC8L",
      productName: "Chicken & Garden Veggie – XL (91+ lbs) (Every Two Weeks)",
      amountCents: 17400,
      interval: "week",
      intervalCount: 2,
    }
  ],
  "turkey-brown-rice-comfort": [
    {
      priceId: "price_1SOlvp0R4BbWwBbfa5xkLVd9",
      productName: "Turkey & Brown Rice Comfort – Small (5–20 lbs) (Every Two Weeks)",
      amountCents: 5800,
      interval: "week",
      intervalCount: 2,
    },
    {
      priceId: "price_1SOlvT0R4BbWwBbfPgFG1MH9",
      productName: "Turkey & Brown Rice Comfort – Medium (21–50 lbs) (Every Two Weeks)",
      amountCents: 9400,
      interval: "week",
      intervalCount: 2,
    },
    {
      priceId: "price_1S8kuf0R4BbWwBbfRB6gwhiA",
      productName: "Turkey & Brown Rice Comfort – Large (51–90 lbs) (Every Two Weeks)",
      amountCents: 13800,
      interval: "week",
      intervalCount: 2,
    },
    {
      priceId: "price_1S8kww0R4BbWwBbfGsB8CiwP",
      productName: "Turkey & Brown Rice Comfort – XL (91+ lbs) (Every Two Weeks)",
      amountCents: 17400,
      interval: "week",
      intervalCount: 2,
    }
  ],
}

// Get the appropriate pricing based on current Stripe mode
export function getStripePricing(): Record<string, StripePricing[]> {
  return isTestMode() ? STRIPE_PRICING_TEST : STRIPE_PRICING_PRODUCTION
}

export function getStripePricingForDog(recipeSlug: string, weightLbs: number): StripePricing | null {
  const recipePricing = getStripePricing()[recipeSlug]
  if (!recipePricing) return null

  // Determine size category based on weight
  let sizeIndex = 0 // Small (5-20 lbs)
  if (weightLbs >= 21 && weightLbs <= 50)
    sizeIndex = 1 // Medium
  else if (weightLbs >= 51 && weightLbs <= 90)
    sizeIndex = 2 // Large
  else if (weightLbs >= 91) sizeIndex = 3 // XL

  return recipePricing[sizeIndex] || recipePricing[0]
}

export function calculateWeeklyPricing(dogData: any): { weeklyAmountCents: number; stripePriceId: string | null } {
  const weight = dogData.dogProfile?.weight || 20
  const weightUnit = dogData.dogProfile?.weightUnit || "lb"

  // Convert to lbs if needed
  const weightLbs = weightUnit === "kg" ? weight * 2.20462 : weight

  // Get primary recipe (use first selected recipe or fallback to selectedRecipe)
  const recipes =
    dogData.selectedRecipes?.length > 0 ? dogData.selectedRecipes : [dogData.selectedRecipe].filter(Boolean)
  const primaryRecipe = recipes[0] || "beef-quinoa-harvest"

  const pricing = getStripePricingForDog(primaryRecipe, weightLbs)

  return {
    weeklyAmountCents: pricing?.amountCents || 2900, // Default to small size
    stripePriceId: pricing?.priceId || null,
  }
}

// Get the appropriate biweekly pricing based on current Stripe mode
export function getStripePricingBiweekly(): Record<string, StripePricing[]> {
  return isTestMode() ? STRIPE_PRICING_TEST_BIWEEKLY : STRIPE_PRICING_PRODUCTION_BIWEEKLY
}

// Get biweekly pricing for a specific dog
export function getStripePricingBiweeklyForDog(recipeSlug: string, weightLbs: number): StripePricing | null {
  const recipePricing = getStripePricingBiweekly()[recipeSlug]
  if (!recipePricing) return null

  // Determine size category based on weight
  let sizeIndex = 0 // Small (5-20 lbs)
  if (weightLbs >= 21 && weightLbs <= 50)
    sizeIndex = 1 // Medium
  else if (weightLbs >= 51 && weightLbs <= 90)
    sizeIndex = 2 // Large
  else if (weightLbs >= 91) sizeIndex = 3 // XL

  return recipePricing[sizeIndex] || recipePricing[0]
}

// Calculate biweekly pricing (same as weekly but with biweekly prices)
export function calculateBiweeklyPricing(dogData: any): { biweeklyAmountCents: number; stripePriceId: string | null } {
  const weight = dogData.dogProfile?.weight || 20
  const weightUnit = dogData.dogProfile?.weightUnit || "lb"

  // Convert to lbs if needed
  const weightLbs = weightUnit === "kg" ? weight * 2.20462 : weight

  // Get primary recipe (use first selected recipe or fallback to selectedRecipe)
  const recipes =
    dogData.selectedRecipes?.length > 0 ? dogData.selectedRecipes : [dogData.selectedRecipe].filter(Boolean)
  const primaryRecipe = recipes[0] || "beef-quinoa-harvest"

  const pricing = getStripePricingBiweeklyForDog(primaryRecipe, weightLbs)

  return {
    biweeklyAmountCents: pricing?.amountCents || 5800, // Default to small size biweekly
    stripePriceId: pricing?.priceId || null,
  }
}

// Export the appropriate pricing based on current mode
export default getStripePricing()
