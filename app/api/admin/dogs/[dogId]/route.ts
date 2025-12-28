import { createClient, supabaseAdmin } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * PATCH /api/admin/dogs/[dogId]
 * Update dog information (admin only)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { dogId: string } }
) {
  const supabase = await createClient()

  // Check admin access
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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { name, weight_kg, activity_level } = body

  // Build update object
  const updates: any = {}
  if (name !== undefined) updates.name = name
  if (weight_kg !== undefined) updates.weight_kg = weight_kg
  if (activity_level !== undefined) updates.activity_level = activity_level

  const { data, error } = await supabaseAdmin
    .from("dogs")
    .update(updates)
    .eq("id", params.dogId)
    .select()
    .single()

  if (error) {
    console.error("Error updating dog:", error)
    return NextResponse.json({ error: "Failed to update dog" }, { status: 500 })
  }

  return NextResponse.json(data)
}
