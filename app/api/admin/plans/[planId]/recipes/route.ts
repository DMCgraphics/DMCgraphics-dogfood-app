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

    // Get plan details
    const { data: plan } = await supabaseAdmin
      .from("plans")
      .select("total_cents, stripe_subscription_id")
      .eq("id", planId)
      .single()

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    // Get existing plan item for Stripe info
    const { data: existingItem } = await supabaseAdmin
      .from("plan_items")
      .select("stripe_price_id, billing_interval")
      .eq("plan_id", planId)
      .limit(1)
      .maybeSingle()

    // Delete existing plan_items
    await supabaseAdmin
      .from("plan_items")
      .delete()
      .eq("plan_id", planId)

    // Fetch recipe details
    const { data: recipes } = await supabaseAdmin
      .from("recipes")
      .select("id, name, slug")
      .in("id", recipeIds)

    if (!recipes || recipes.length === 0) {
      return NextResponse.json({ error: "Invalid recipe IDs" }, { status: 400 })
    }

    // Create new plan_items
    const unitPrice = Math.floor((plan.total_cents || 0) / recipes.length)
    const newPlanItems = recipes.map(recipe => ({
      plan_id: planId,
      recipe_id: recipe.id,
      qty: 1,
      unit_price_cents: unitPrice,
      stripe_price_id: existingItem?.stripe_price_id || null,
      billing_interval: existingItem?.billing_interval || 'week',
      meta: {
        recipe_variety: recipes.map(r => ({
          id: r.id,
          name: r.name,
          slug: r.slug
        }))
      }
    }))

    const { error: insertError } = await supabaseAdmin
      .from("plan_items")
      .insert(newPlanItems)

    if (insertError) {
      console.error("Error creating plan items:", insertError)
      return NextResponse.json({ error: "Failed to update recipes" }, { status: 500 })
    }

    // Update plan with snapshot and ensure total_cents is preserved
    await supabaseAdmin
      .from("plans")
      .update({
        total_cents: plan.total_cents, // Preserve the total_cents at top level
        snapshot: {
          total_cents: plan.total_cents,
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
