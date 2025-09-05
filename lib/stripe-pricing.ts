interface StripePricing {
  priceId: string
  productName: string
  amountCents: number
  interval: string
}

// Stripe pricing data from user's CSV - weekly recurring subscriptions
const STRIPE_PRICING: Record<string, StripePricing[]> = {
  "beef-quinoa-harvest": [
    {
      priceId: "price_1S32GB0R4BbWwBbfY0N2OQyo",
      productName: "Beef & Quinoa Harvest – Small (5–20 lbs) (Weekly)",
      amountCents: 2100,
      interval: "week",
    },
    {
      priceId: "price_1S330D0R4BbWwBbfsZMb9vOm",
      productName: "Beef & Quinoa Harvest – Medium (21–50 lbs) (Weekly)",
      amountCents: 3500,
      interval: "week",
    },
    {
      priceId: "price_1S33yk0R4BbWwBbfKd5aOJpk",
      productName: "Beef & Quinoa Harvest – Large (51–90 lbs) (Weekly)",
      amountCents: 4900,
      interval: "week",
    },
    {
      priceId: "price_1S33zx0R4BbWwBbf1AC8sUHf",
      productName: "Beef & Quinoa Harvest – XL (91+ lbs) (Weekly)",
      amountCents: 6300,
      interval: "week",
    },
  ],
  "chicken-greens": [
    {
      priceId: "price_1S340d0R4BbWwBbfqjQqMlhv",
      productName: "Chicken & Greens – Small (5–20 lbs) (Weekly)",
      amountCents: 2100,
      interval: "week",
    },
    {
      priceId: "price_1S341d0R4BbWwBbf7S33jVQr",
      productName: "Chicken & Greens – Medium (21–50 lbs) (Weekly)",
      amountCents: 3500,
      interval: "week",
    },
    {
      priceId: "price_1S342T0R4BbWwBbfQ0v71HSC",
      productName: "Chicken & Greens – Large (51–90 lbs) (Weekly)",
      amountCents: 4900,
      interval: "week",
    },
    {
      priceId: "price_1S343o0R4BbWwBbf5RVMEC8L",
      productName: "Chicken & Greens – XL (91+ lbs) (Weekly)",
      amountCents: 6300,
      interval: "week",
    },
  ],
  "lamb-quinoa": [
    {
      priceId: "price_1S345x0R4BbWwBbfJRGIQ4g5",
      productName: "Lamb & Quinoa – Small (5–20 lbs) (Weekly)",
      amountCents: 2100,
      interval: "week",
    },
    {
      priceId: "price_1S346x0R4BbWwBbf1FENODao",
      productName: "Lamb & Quinoa – Medium (21–50 lbs) (Weekly)",
      amountCents: 3500,
      interval: "week",
    },
    {
      priceId: "price_1S347g0R4BbWwBbfvaKYdyLs",
      productName: "Lamb & Quinoa – Large (51–90 lbs) (Weekly)",
      amountCents: 4900,
      interval: "week",
    },
    {
      priceId: "price_1S348p0R4BbWwBbfHoE8iLIi",
      productName: "Lamb & Quinoa – XL (91+ lbs) (Weekly)",
      amountCents: 6300,
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
    weeklyAmountCents: pricing?.amountCents || 2100, // Default to small size
    stripePriceId: pricing?.priceId || null,
  }
}

export default STRIPE_PRICING
