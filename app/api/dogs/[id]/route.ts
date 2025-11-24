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

    // Check if user owns this dog
    const { data: dog, error: fetchError } = await supabase
      .from("dogs")
      .select("id, user_id, name")
      .eq("id", dogId)
      .single()

    if (fetchError || !dog) {
      return NextResponse.json({ error: "Dog not found" }, { status: 404 })
    }

    const isOwner = dog.user_id === user.id

    // Check if user is admin (only needed if not the owner)
    let isAdmin = false
    if (!isOwner) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single()
      isAdmin = profile?.is_admin || false
    }

    // Only allow deletion if user owns the dog or is admin
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Use user's own client if they own the dog, admin client only for admins deleting others' dogs
    const client = isOwner ? supabase : supabaseAdmin

    // Delete related data first (in case CASCADE isn't set up)
    await client.from("weight_logs").delete().eq("dog_id", dogId)
    await client.from("stool_logs").delete().eq("dog_id", dogId)
    await client.from("plan_items").delete().eq("dog_id", dogId)
    await client.from("plan_dogs").delete().eq("dog_id", dogId)
    await client.from("plans").delete().eq("dog_id", dogId)

    // Now delete the dog
    const { error: deleteError } = await client
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

    console.log(`Dog deleted: ${dog.name} (${dogId}) by user ${user.id}${isAdmin ? " (admin)" : ""}`)

    return NextResponse.json({ success: true, message: `${dog.name} has been deleted` })
  } catch (error) {
    console.error("Error in DELETE /api/dogs/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
