import { NextResponse } from "next/server"
import { getAdminUser } from "@/lib/admin/auth"
import { supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const VALID_ROLES = ['admin', 'delivery_driver', 'sales_manager', 'sales_rep', 'operations']

export async function POST(req: Request) {
  try {
    // Check admin authorization
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { userId, roles } = body

    if (!userId || !Array.isArray(roles)) {
      return NextResponse.json(
        { error: "User ID and roles array are required" },
        { status: 400 }
      )
    }

    // Validate roles
    const invalidRoles = roles.filter(role => !VALID_ROLES.includes(role))
    if (invalidRoles.length > 0) {
      return NextResponse.json(
        { error: `Invalid roles: ${invalidRoles.join(', ')}` },
        { status: 400 }
      )
    }

    // Prevent user from removing their own admin role
    if (userId === adminUser.id && !roles.includes('admin')) {
      return NextResponse.json(
        { error: "You cannot remove your own admin role" },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin

    // Update profile with new roles
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        roles: roles,
        is_admin: roles.includes('admin'), // Keep is_admin in sync for backward compatibility
        updated_at: new Date().toISOString()
      })
      .eq("id", userId)

    if (updateError) {
      console.error("[admin] Error updating user roles:", updateError)
      return NextResponse.json(
        { error: updateError.message || "Failed to update user roles" },
        { status: 500 }
      )
    }

    // Log the change
    console.log(`[admin] User roles updated by ${adminUser.email}:`, {
      user_id: userId,
      new_roles: roles
    })

    return NextResponse.json({
      success: true,
      message: "User roles updated successfully"
    })
  } catch (error: any) {
    console.error("[admin] Error updating user roles:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update user roles" },
      { status: 500 }
    )
  }
}
