interface StripePricing {
  priceId: string
  productName: string
  amountCents: number
  interval: string
}

// Stripe pricing data - weekly recurring subscriptions
// Updated 2025-10-22 with new pricing structure
const STRIPE_PRICING: Record<string, StripePricing[]> = {
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

export function getStripePricingForDog(recipeSlug: string, weightLbs: number): StripePricing | null {
  const recipePricing = STRIPE_PRICING[recipeSlug]
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

export default STRIPE_PRICING
