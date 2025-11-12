import { NextResponse } from "next/server"
import { createServerSupabase, supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    // Check if user is an admin
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user has admin role
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("roles")
      .eq("id", user.id)
      .single()

    if (!profile?.roles || !profile.roles.includes('admin')) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      )
    }

    // Delete the user using Supabase Admin API
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error("[admin] Error deleting user:", deleteError)
      return NextResponse.json(
        { error: deleteError.message || "Failed to delete user" },
        { status: 500 }
      )
    }

    console.log(`[admin] User deleted by ${user.email}:`, {
      deleted_user_id: userId
    })

    return NextResponse.json({
      success: true,
      message: "User deleted successfully"
    })
  } catch (error: any) {
    console.error("[admin] Error deleting user:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status: 500 }
    )
  }
}
