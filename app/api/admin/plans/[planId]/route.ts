import { NextResponse } from "next/server"
import { createClient, supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * PATCH /api/admin/plans/[planId]
 * Update plan type and topper level (admin only)
 */
export async function PATCH(
  req: Request,
  { params }: { params: { planId: string } }
) {
  try {
    // Check admin permission
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin, roles")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin && !profile?.roles?.includes('admin')) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { plan_type, topper_level } = body
    const { planId } = params

    // Validate plan_type
    if (plan_type && !['full', 'topper'].includes(plan_type)) {
      return NextResponse.json({ error: "Invalid plan_type" }, { status: 400 })
    }

    // Validate topper_level
    if (topper_level && !['25', '50', '75', null].includes(topper_level)) {
      return NextResponse.json({ error: "Invalid topper_level" }, { status: 400 })
    }

    // If plan_type is full, topper_level should be null
    const finalTopperLevel = plan_type === 'full' ? null : topper_level

    // Update plan
    const { data: updatedPlan, error: updateError } = await supabaseAdmin
      .from("plans")
      .update({
        plan_type: plan_type,
        topper_level: finalTopperLevel,
      })
      .eq("id", planId)
      .select("id, plan_type, topper_level, dog_id, user_id")
      .single()

    if (updateError || !updatedPlan) {
      console.error("Error updating plan:", updateError)
      return NextResponse.json({ error: "Failed to update plan" }, { status: 500 })
    }

    // Recalculate plan_items with new plan type
    await recalculatePlanItems(planId, updatedPlan.dog_id)

    return NextResponse.json({ success: true, plan: updatedPlan })

  } catch (error: any) {
    console.error("Error updating plan:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Recalculate plan_items using DER formula
 */
async function recalculatePlanItems(planId: string, dogId: string) {
  // Get plan details
  const { data: plan } = await supabaseAdmin
    .from("plans")
    .select("plan_type, topper_level")
    .eq("id", planId)
    .single()

  if (!plan) return

  // Get dog details
  const { data: dog } = await supabaseAdmin
    .from("dogs")
    .select("weight_kg, activity_level")
    .eq("id", dogId)
    .single()

  if (!dog) return

  // Get current plan items to know which recipes
  const { data: currentItems } = await supabaseAdmin
    .from("plan_items")
    .select("recipe_id, recipes:recipe_id(id, kcal_per_100g)")
    .eq("plan_id", planId)

  if (!currentItems || currentItems.length === 0) return

  // Calculate DER
  const RER = 110 * Math.pow(parseFloat(dog.weight_kg), 0.75)
  let activityMultiplier = 1.0
  if (dog.activity_level === 'low') activityMultiplier = 0.8
  else if (dog.activity_level === 'high') activityMultiplier = 1.2

  const DER = RER * activityMultiplier

  // Apply plan type multiplier
  let portionMultiplier = 1.0
  if (plan.plan_type === 'topper' && plan.topper_level) {
    portionMultiplier = parseInt(plan.topper_level) / 100
  }

  const dailyKcalNeeded = DER * portionMultiplier
  const dailyKcalPerRecipe = dailyKcalNeeded / currentItems.length

  // Update each plan_item with recalculated size_g
  for (const item of currentItems) {
    const recipe = item.recipes as any
    const kcalPer100g = recipe?.kcal_per_100g || 160
    const kcalPerKg = kcalPer100g * 10

    const dailyKg = dailyKcalPerRecipe / kcalPerKg
    const dailyGrams = dailyKg * 1000
    const biweeklyGrams = Math.round(dailyGrams * 14)

    await supabaseAdmin
      .from("plan_items")
      .update({ size_g: biweeklyGrams })
      .eq("plan_id", planId)
      .eq("recipe_id", item.recipe_id)
  }
}
