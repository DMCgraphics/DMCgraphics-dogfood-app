/**
 * Social proof data for recipes in the plan builder
 * Includes popularity scores, review counts, ratings, and customer photos
 */

export interface RecipeSocialProof {
  popularityScore: number // 0-100, percentage of dogs that love this recipe
  reviewCount: number
  averageRating: number // 1-5 stars
  customerPhotos: string[]
}

/**
 * Hardcoded social proof data for each recipe
 * Recipe IDs match those in lib/nutrition-calculator.ts
 */
export const recipeSocialProof: Record<string, RecipeSocialProof> = {
  "beef-quinoa-harvest": {
    popularityScore: 92,
    reviewCount: 148,
    averageRating: 4.8,
    customerPhotos: ["/dog-photo-plan-builder.png"],
  },
  "lamb-pumpkin-feast": {
    popularityScore: 87,
    reviewCount: 132,
    averageRating: 4.7,
    customerPhotos: ["/dog-photo-plan-builder.png"],
  },
  "chicken-garden-veggie": {
    popularityScore: 94,
    reviewCount: 176,
    averageRating: 4.9,
    customerPhotos: ["/dog-photo-plan-builder.png"],
  },
  "turkey-brown-rice": {
    popularityScore: 89,
    reviewCount: 124,
    averageRating: 4.6,
    customerPhotos: ["/dog-photo-plan-builder.png"],
  },
}

/**
 * Get social proof data for a specific recipe
 * @param recipeId - The recipe ID to look up
 * @returns Social proof data or undefined if not found
 */
export function getRecipeSocialProof(recipeId: string): RecipeSocialProof | undefined {
  return recipeSocialProof[recipeId]
}
