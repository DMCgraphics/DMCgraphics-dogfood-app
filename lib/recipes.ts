/**
 * Recipe data utilities - fetches from database (single source of truth)
 */

import { createClient } from "@/lib/supabase/server"

export interface Recipe {
  id: string
  name: string
  slug: string
  description: string | null
  kcalPer100g: number
  protein: number
  fat: number
  carbs: number
  fiber: number
  moisture: number
  calcium: number
  phosphorus: number
  epa: number
  dha: number
  allergens: string[]
  ingredients: string[]
  premixDetails: Record<string, string[]>
  aafcoLifeStage: string
  sourcing: string[]
  sustainabilityScore: number
  comingSoon: boolean
}

/**
 * Fetch all recipes from database
 */
export async function getAllRecipes(): Promise<Recipe[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("is_active", true)
    .order("name")

  if (error) {
    console.error("Error fetching recipes:", error)
    return []
  }

  return (data || []).map(mapDatabaseRecipe)
}

/**
 * Fetch a single recipe by slug
 */
export async function getRecipeBySlug(slug: string): Promise<Recipe | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (error) {
    console.error(`Error fetching recipe ${slug}:`, error)
    return null
  }

  return mapDatabaseRecipe(data)
}

/**
 * Fetch recipe by name (for AI recommendations)
 */
export async function getRecipeByName(name: string): Promise<Recipe | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("name", name)
    .eq("is_active", true)
    .single()

  if (error) {
    console.error(`Error fetching recipe "${name}":`, error)
    return null
  }

  return mapDatabaseRecipe(data)
}

/**
 * Map database row to Recipe interface
 */
function mapDatabaseRecipe(row: any): Recipe {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    kcalPer100g: row.kcal_per_100g || 0,
    protein: row.protein_percent || 0,
    fat: row.fat_percent || 0,
    carbs: row.carbs_percent || 0,
    fiber: row.fiber_percent || 0,
    moisture: row.moisture_percent || 0,
    calcium: row.calcium_mg || 0,
    phosphorus: row.phosphorus_mg || 0,
    epa: row.epa_mg || 0,
    dha: row.dha_mg || 0,
    allergens: row.allergens || [],
    ingredients: Array.isArray(row.ingredients)
      ? row.ingredients
      : (typeof row.ingredients === 'object' && row.ingredients !== null)
        ? Object.values(row.ingredients)
        : [],
    premixDetails: row.premix_details || {},
    aafcoLifeStage: row.aafco_life_stage || "adult",
    sourcing: row.sourcing || [],
    sustainabilityScore: row.sustainability_score || 0,
    comingSoon: row.coming_soon || false,
  }
}
