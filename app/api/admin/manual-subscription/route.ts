import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export interface RecipeSelection {
  recipeId: string
  recipeName: string
}

export interface ManualSubscriptionRequest {
  customerEmail: string
  customerName: string
  dogName: string
  dogWeightLbs: number
  dogAge: string
  dogActivityLevel: 'low' | 'moderate' | 'high'
  planType: 'full' | 'topper'
  topperPercentage?: 25 | 50 | 75
  recipes: RecipeSelection[]
}

/**
 * POST /api/admin/manual-subscription
 * Manually create a subscription for customers who paid via Stripe but haven't claimed online
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

  const body: ManualSubscriptionRequest = await request.json()
  const {
    customerEmail,
    customerName,
    dogName,
    dogWeightLbs,
    dogAge,
    dogActivityLevel,
    planType,
    topperPercentage,
    recipes
  } = body

  try {
    // Convert lbs to kg
    const weightKg = dogWeightLbs * 0.453592

    // 1. Check if profile exists for this email
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", customerEmail)
      .maybeSingle()

    let profileId = existingProfile?.id

    // 2. If profile doesn't exist, create it
    if (!profileId) {
      // Generate a UUID for the profile (profiles table requires explicit ID)
      const newProfileId = crypto.randomUUID()

      const { data: newProfile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: newProfileId,
          email: customerEmail,
          full_name: customerName,
        })
        .select()
        .single()

      if (profileError) {
        console.error("Error creating profile:", profileError)
        return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
      }

      profileId = newProfile.id
    }

    // 3. Check if dog already exists for this profile
    const { data: existingDog } = await supabase
      .from("dogs")
      .select("id, weight_kg")
      .eq("user_id", profileId)
      .eq("name", dogName)
      .maybeSingle()

    let dogId = existingDog?.id

    // 4. If dog doesn't exist, create it; otherwise update weight/activity
    if (!dogId) {
      const { data: newDog, error: dogError } = await supabase
        .from("dogs")
        .insert({
          user_id: profileId,
          name: dogName,
          weight_kg: weightKg,
          activity_level: dogActivityLevel,
        })
        .select()
        .single()

      if (dogError) {
        console.error("Error creating dog:", dogError)
        return NextResponse.json({ error: "Failed to create dog" }, { status: 500 })
      }

      dogId = newDog.id
    } else {
      // Update existing dog's weight and activity level
      const { error: updateError } = await supabase
        .from("dogs")
        .update({
          weight_kg: weightKg,
          activity_level: dogActivityLevel,
        })
        .eq("id", dogId)

      if (updateError) {
        console.error("Error updating dog:", updateError)
      }
    }

    // 5. Calculate biweekly food amount using standard body weight percentage
    // Low: 2%, Moderate: 2.5%, High: 3% of body weight per day
    let dailyPercentage = 0.025 // 2.5% for moderate
    if (dogActivityLevel === 'low') dailyPercentage = 0.02
    else if (dogActivityLevel === 'high') dailyPercentage = 0.03

    const dailyGrams = weightKg * 1000 * dailyPercentage

    // Determine portion multiplier based on plan type
    let portionMultiplier = 1.0 // Full meal = 100%
    if (planType === 'topper' && topperPercentage) {
      portionMultiplier = topperPercentage / 100
    }

    // 6. Create plan
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .insert({
        user_id: profileId,
        status: "active",
        frequency: "biweekly",
      })
      .select()
      .single()

    if (planError) {
      console.error("Error creating plan:", planError)
      return NextResponse.json({ error: "Failed to create plan" }, { status: 500 })
    }

    // 7. Create plan items for each selected recipe
    const planItems = []

    // Calculate biweekly grams split equally across all recipes
    const biweeklyGramsTotal = dailyGrams * portionMultiplier * 14
    const biweeklyGramsForRecipe = Math.round(biweeklyGramsTotal / recipes.length)

    for (const recipe of recipes) {

      const { data: planItem, error: planItemError } = await supabase
        .from("plan_items")
        .insert({
          plan_id: plan.id,
          dog_id: dogId,
          recipe_id: recipe.recipeId,
          qty: 1,
          size_g: biweeklyGramsForRecipe,
        })
        .select()
        .single()

      if (planItemError) {
        console.error("Error creating plan item:", planItemError)
        return NextResponse.json({ error: "Failed to create plan item" }, { status: 500 })
      }

      planItems.push({
        id: planItem.id,
        recipe: recipe.recipeName,
        biweekly_grams: biweeklyGramsForRecipe
      })
    }

    return NextResponse.json({
      success: true,
      profile: { id: profileId, email: customerEmail },
      dog: { id: dogId, name: dogName, weight_kg: weightKg },
      plan: { id: plan.id, status: "active", type: planType, percentage: topperPercentage || 100 },
      planItems
    })

  } catch (error) {
    console.error("Error creating manual subscription:", error)
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
  }
}
