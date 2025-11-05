import { NextResponse } from "next/server"
import { getAdminUser } from "@/lib/admin/auth"
import { createServerSupabase } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    // Check admin authorization
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email parameter required" }, { status: 400 })
    }

    const supabase = createServerSupabase()

    // Search for user by email in auth.users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      return NextResponse.json({ error: "Failed to search users" }, { status: 500 })
    }

    const matchedUser = users.users.find((u) =>
      u.email?.toLowerCase().includes(email.toLowerCase())
    )

    if (!matchedUser) {
      return NextResponse.json({
        user: null,
        subscriptions: [],
        message: "No user found with that email"
      })
    }

    // Get subscriptions for this user
    const { data: subscriptions, error: subsError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", matchedUser.id)
      .order("created_at", { ascending: false })

    if (subsError) {
      console.error("Error fetching subscriptions:", subsError)
    }

    return NextResponse.json({
      user: {
        id: matchedUser.id,
        email: matchedUser.email,
        created_at: matchedUser.created_at,
      },
      subscriptions: subscriptions || [],
    })
  } catch (error: any) {
    console.error("[admin] Error searching:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
