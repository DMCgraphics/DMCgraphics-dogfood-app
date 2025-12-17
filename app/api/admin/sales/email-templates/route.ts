import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Role verification - must be admin, sales_manager, or sales_rep
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles, is_admin")
      .eq("id", user.id)
      .single()

    const isAuthorized =
      profile?.is_admin ||
      profile?.roles?.includes("sales_manager") ||
      profile?.roles?.includes("sales_rep")

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden - Requires admin or sales team role" },
        { status: 403 }
      )
    }

    // Get active templates
    const { data: templates, error } = await supabase
      .from("sales_email_templates")
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("name", { ascending: true })

    if (error) {
      console.error("[email-templates] Error fetching templates:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[email-templates] Retrieved ${templates?.length || 0} templates for user ${user.email}`)

    return NextResponse.json({ templates: templates || [] })
  } catch (error: any) {
    console.error("[email-templates] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch templates" },
      { status: 500 }
    )
  }
}
