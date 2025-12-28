import { createClient, supabaseAdmin } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * POST /api/admin/fix-dog-weight
 * Fix a dog's weight (admin only)
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

  const body = await request.json()
  const { dogId, weightKg } = body

  if (!dogId || !weightKg) {
    return NextResponse.json({ error: "Missing dogId or weightKg" }, { status: 400 })
  }

  try {
    // Use supabaseAdmin to bypass RLS
    const { data: dog, error } = await supabaseAdmin
      .from("dogs")
      .update({ weight_kg: weightKg })
      .eq("id", dogId)
      .select("id, name, weight_kg")
      .single()

    if (error) {
      console.error("Error updating dog weight:", error)
      return NextResponse.json({ error: "Failed to update dog weight" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      dog: {
        id: dog.id,
        name: dog.name,
        weight_kg: dog.weight_kg,
        weight_lbs: parseFloat(dog.weight_kg) * 2.20462
      }
    })
  } catch (error) {
    console.error("Error updating dog weight:", error)
    return NextResponse.json({ error: "Failed to update dog weight" }, { status: 500 })
  }
}
