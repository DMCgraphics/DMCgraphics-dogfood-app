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
    const { email, password, full_name, is_admin } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Use admin client for creating users
    const supabase = supabaseAdmin

    // Create user in Supabase Auth
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: full_name || email.split("@")[0]
      }
    })

    if (createError || !newUser.user) {
      console.error("[admin] Error creating user:", createError)
      return NextResponse.json(
        { error: createError?.message || "Failed to create user" },
        { status: 500 }
      )
    }

    // Create/update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: newUser.user.id,
        full_name: full_name || email.split("@")[0],
        is_admin: is_admin || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error("[admin] Error creating profile:", profileError)
      // Don't fail if profile creation fails, user is already created
    }

    // Log the creation
    console.log(`[admin] User created by ${adminUser.email}:`, {
      new_user_id: newUser.user.id,
      new_user_email: email,
      is_admin: is_admin || false
    })

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        full_name: full_name || email.split("@")[0],
        is_admin: is_admin || false,
        created_at: newUser.user.created_at
      }
    })
  } catch (error: any) {
    console.error("[admin] Error creating user:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    )
  }
}
