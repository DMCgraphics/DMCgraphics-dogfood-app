import { NextResponse } from "next/server"
import { createClient, supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/admin/dogs/[dogId]/plan
 * Fetch plan data for a specific dog (admin only)
 */
export async function GET(
  req: Request,
  { params }: { params: { dogId: string } }
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

    const { dogId } = params

    // Get plan for this dog
    const { data: plan, error: planError } = await supabaseAdmin
      .from("plans")
      .select("id, plan_type, topper_level")
      .eq("dog_id", dogId)
      .in("status", ["active", "purchased", "checkout_in_progress"])
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    // Get recipe IDs from plan_items
    const { data: planItems, error: itemsError } = await supabaseAdmin
      .from("plan_items")
      .select("recipe_id")
      .eq("plan_id", plan.id)

    if (itemsError) {
      console.error("Error fetching plan items:", itemsError)
      return NextResponse.json({ error: "Failed to fetch plan items" }, { status: 500 })
    }

    const recipe_ids = planItems?.map(item => item.recipe_id) || []

    return NextResponse.json({
      id: plan.id,
      plan_type: plan.plan_type,
      topper_level: plan.topper_level,
      recipe_ids,
    })

  } catch (error: any) {
    console.error("Error fetching plan data:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
