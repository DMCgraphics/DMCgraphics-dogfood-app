import { NextResponse } from "next/server"
import { createServerSupabase, supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function PUT(
  req: Request,
  { params }: { params: { planId: string } }
) {
  try {
    // Check admin permission
    const supabase = await createServerSupabase()
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

    const { recipeIds } = await req.json()
    const { planId } = params

    if (!recipeIds || recipeIds.length === 0) {
      return NextResponse.json({ error: "At least one recipe required" }, { status: 400 })
    }

    // Get plan details including snapshot
    const { data: plan } = await supabaseAdmin
      .from("plans")
      .select("total_cents, stripe_subscription_id, snapshot, dog_id, plan_type, topper_level")
      .eq("id", planId)
      .single()

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    // Get correct total_cents (prefer snapshot if top-level is 0)
    let totalCents = plan.total_cents || 0
    if (totalCents === 0 && plan.snapshot?.total_cents) {
      totalCents = plan.snapshot.total_cents
    }

    // Get Stripe price ID from subscription (not from plan_items that we're about to delete!)
    let stripePriceId: string | null = null
    let billingInterval = 'week'

    if (plan.stripe_subscription_id) {
      try {
        const { stripe } = await import("@/lib/stripe")
        const stripeSub = await stripe.subscriptions.retrieve(plan.stripe_subscription_id)
        stripePriceId = stripeSub.items.data[0].price.id
        billingInterval = stripeSub.items.data[0].price.recurring?.interval || 'week'

        // If still no totalCents, get it from Stripe
        if (totalCents === 0) {
          totalCents = stripeSub.items.data[0].price.unit_amount || 0
        }
      } catch (error) {
        console.error("Failed to fetch Stripe subscription:", error)
        if (totalCents === 0) {
          return NextResponse.json({ error: "Could not determine plan pricing" }, { status: 500 })
        }
      }
    }

    // Delete existing plan_items (after we have stripe_price_id!)
    await supabaseAdmin
      .from("plan_items")
      .delete()
      .eq("plan_id", planId)

    // Fetch recipe details including kcal data
    const { data: recipes } = await supabaseAdmin
      .from("recipes")
      .select("id, name, slug, kcal_per_100g")
      .in("id", recipeIds)

    if (!recipes || recipes.length === 0) {
      return NextResponse.json({ error: "Invalid recipe IDs" }, { status: 400 })
    }

    // Get dog details for DER calculation
    const { data: dog } = await supabaseAdmin
      .from("dogs")
      .select("weight_kg, activity_level")
      .eq("id", plan.dog_id)
      .single()

    if (!dog) {
      return NextResponse.json({ error: "Dog not found" }, { status: 404 })
    }

    // Calculate DER (Daily Energy Requirement)
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
    const dailyKcalPerRecipe = dailyKcalNeeded / recipes.length

    // Calculate unit price using CORRECT total_cents
    const unitPrice = Math.floor(totalCents / recipes.length)

    // Create plan items with calculated size_g
    const newPlanItems = recipes.map(recipe => {
      const kcalPer100g = recipe.kcal_per_100g || 160
      const kcalPerKg = kcalPer100g * 10

      const dailyKg = dailyKcalPerRecipe / kcalPerKg
      const dailyGrams = dailyKg * 1000
      const biweeklyGrams = Math.round(dailyGrams * 14)

      return {
        plan_id: planId,
        recipe_id: recipe.id,
        qty: 1,
        size_g: biweeklyGrams,
        unit_price_cents: unitPrice,
        stripe_price_id: stripePriceId,
        billing_interval: billingInterval,
        meta: {
          recipe_variety: recipes.map(r => ({
            id: r.id,
            name: r.name,
            slug: r.slug
          }))
        }
      }
    })

    const { error: insertError } = await supabaseAdmin
      .from("plan_items")
      .insert(newPlanItems)

    if (insertError) {
      console.error("Error creating plan items:", insertError)
      return NextResponse.json({ error: "Failed to update recipes" }, { status: 500 })
    }

    // Update plan with snapshot and PRESERVE correct total_cents
    await supabaseAdmin
      .from("plans")
      .update({
        total_cents: totalCents, // Use the CORRECT value we determined above!
        snapshot: {
          total_cents: totalCents,
          billing_cycle: 'every_2_weeks',
          recipes: recipes.map(r => ({
            id: r.id,
            name: r.name,
            slug: r.slug,
            quantity: 1
          })),
          updated_at: new Date().toISOString()
        }
      })
      .eq("id", planId)

    return NextResponse.json({ success: true, recipes })

  } catch (error: any) {
    console.error("Error updating plan recipes:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
