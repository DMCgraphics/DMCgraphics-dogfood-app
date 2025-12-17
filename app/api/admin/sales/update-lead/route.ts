import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user is admin or sales team
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles")
    .eq("id", user.id)
    .single()

  const roles = profile?.roles || []
  const hasPermission = roles.includes("admin") || roles.includes("sales_manager") || roles.includes("sales_rep")

  if (!hasPermission) {
    return NextResponse.json({ error: "Forbidden - Requires admin or sales team role" }, { status: 403 })
  }

  const body = await request.json()
  const {
    leadId,
    full_name,
    phone,
    dog_name,
    dog_weight,
    dog_breed,
    zip_code,
    notes,
    tags,
    priority
  } = body

  if (!leadId) {
    return NextResponse.json({ error: "Lead ID is required" }, { status: 400 })
  }

  // Validate priority if provided
  if (priority && !['hot', 'warm', 'cold'].includes(priority)) {
    return NextResponse.json({ error: "Invalid priority value" }, { status: 400 })
  }

  try {
    const updateData: any = {}

    // Only include fields that are being updated
    if (full_name !== undefined) updateData.full_name = full_name
    if (phone !== undefined) updateData.phone = phone
    if (dog_name !== undefined) updateData.dog_name = dog_name
    if (dog_weight !== undefined) updateData.dog_weight = dog_weight
    if (dog_breed !== undefined) updateData.dog_breed = dog_breed
    if (zip_code !== undefined) updateData.zip_code = zip_code
    if (notes !== undefined) updateData.notes = notes
    if (tags !== undefined) updateData.tags = tags
    if (priority !== undefined) updateData.priority = priority

    const { error: updateError } = await supabase
      .from("sales_leads")
      .update(updateData)
      .eq("id", leadId)

    if (updateError) {
      console.error("[Update Lead] Error updating lead:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log(`[Update Lead] Lead ${leadId} updated by user ${user.email}`)

    return NextResponse.json({ success: true, message: "Lead updated successfully" })
  } catch (error) {
    console.error("[Update Lead] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update lead" },
      { status: 500 }
    )
  }
}
