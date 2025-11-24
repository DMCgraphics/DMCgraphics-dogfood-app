import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase, supabaseAdmin } from "@/lib/supabase/server"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dogId = params.id

    // Check if user owns this dog or is admin
    const { data: dog, error: fetchError } = await supabase
      .from("dogs")
      .select("id, user_id, name")
      .eq("id", dogId)
      .single()

    if (fetchError || !dog) {
      return NextResponse.json({ error: "Dog not found" }, { status: 404 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    const isAdmin = profile?.is_admin || false

    // Only allow deletion if user owns the dog or is admin
    if (dog.user_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Use admin client to delete dog and cascade delete related data
    // The database should have CASCADE DELETE set up, but we'll delete manually to be safe
    const admin = supabaseAdmin()

    // Delete related data first (in case CASCADE isn't set up)
    await admin.from("weight_logs").delete().eq("dog_id", dogId)
    await admin.from("stool_logs").delete().eq("dog_id", dogId)
    await admin.from("plan_items").delete().eq("dog_id", dogId)
    await admin.from("plans").delete().eq("dog_id", dogId)

    // Now delete the dog
    const { error: deleteError } = await admin
      .from("dogs")
      .delete()
      .eq("id", dogId)

    if (deleteError) {
      console.error("Error deleting dog:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete dog" },
        { status: 500 }
      )
    }

    console.log(`[v0] Dog deleted: ${dog.name} (${dogId}) by user ${user.id}${isAdmin ? " (admin)" : ""}`)

    return NextResponse.json({ success: true, message: `${dog.name} has been deleted` })
  } catch (error) {
    console.error("Error in DELETE /api/dogs/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
