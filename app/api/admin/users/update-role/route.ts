import { NextResponse } from "next/server"
import { getAdminUser } from "@/lib/admin/auth"
import { supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    // Check admin authorization
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { userId, isAdmin } = body

    if (!userId || typeof isAdmin !== "boolean") {
      return NextResponse.json(
        { error: "User ID and isAdmin boolean are required" },
        { status: 400 }
      )
    }

    // Prevent user from removing their own admin status
    if (userId === adminUser.id && !isAdmin) {
      return NextResponse.json(
        { error: "You cannot remove your own admin status" },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin

    // Update profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        is_admin: isAdmin,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId)

    if (updateError) {
      console.error("[admin] Error updating user role:", updateError)
      return NextResponse.json(
        { error: updateError.message || "Failed to update user role" },
        { status: 500 }
      )
    }

    // Log the change
    console.log(`[admin] User role updated by ${adminUser.email}:`, {
      user_id: userId,
      new_admin_status: isAdmin
    })

    return NextResponse.json({
      success: true,
      message: `User ${isAdmin ? "promoted to" : "removed from"} admin role`
    })
  } catch (error: any) {
    console.error("[admin] Error updating user role:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update user role" },
      { status: 500 }
    )
  }
}
