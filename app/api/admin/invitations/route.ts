import { NextResponse } from "next/server"
import { getAdminUser } from "@/lib/admin/auth"
import { supabaseAdmin } from "@/lib/supabase/server"

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
    const status = searchParams.get("status")
    const email = searchParams.get("email")
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = parseInt(searchParams.get("offset") || "0")

    const supabase = supabaseAdmin
    let query = supabase
      .from("subscription_invitations")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq("status", status)
    }

    if (email) {
      query = query.ilike("email", `%${email}%`)
    }

    const { data: invitations, error, count } = await query

    if (error) {
      console.error("[admin] Error fetching invitations:", error)
      return NextResponse.json(
        { error: error.message || "Failed to fetch invitations" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      invitations,
      total: count,
      limit,
      offset
    })
  } catch (error: any) {
    console.error("[admin] Error fetching invitations:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch invitations" },
      { status: 500 }
    )
  }
}
