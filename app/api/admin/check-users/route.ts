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

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(`
        email,
        full_name,
        marketing_opt_in,
        subscriptions (
          status,
          created_at
        )
      `)
      .in("email", emails)

    if (error) {
      console.error("[Check Users] Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

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
