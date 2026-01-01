import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * Check specific users' subscription and marketing status
 */
export async function POST(req: NextRequest) {
  try {
    const { emails } = await req.json()

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json({ error: "emails array required" }, { status: 400 })
    }

    // Get profiles
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, marketing_opt_in")
      .in("email", emails)

    if (profileError) {
      console.error("[Check Users] Profile error:", profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ success: true, users: [], count: 0 })
    }

    // Get subscriptions for these users
    const userIds = profiles.map(p => p.id)
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id, status, created_at")
      .in("user_id", userIds)

    // Combine the data
    const data = profiles.map(profile => ({
      ...profile,
      subscriptions: subscriptions?.filter(s => s.user_id === profile.id) || []
    }))

    return NextResponse.json({
      success: true,
      users: data,
      count: data?.length || 0,
    })
  } catch (error) {
    console.error("[Check Users] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check users" },
      { status: 500 }
    )
  }
}
