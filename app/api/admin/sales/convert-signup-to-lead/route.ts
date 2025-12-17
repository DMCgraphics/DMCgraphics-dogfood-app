import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabase()

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin, sales_manager, or sales_rep role
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles, is_admin")
      .eq("id", user.id)
      .single()

    const isAuthorized = profile?.is_admin ||
      profile?.roles?.includes("sales_manager") ||
      profile?.roles?.includes("sales_rep")

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { signupId, email, dogName, zipCode, phone, eventName, utmSource } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Check if lead already exists for this email from this source
    const { data: existingLead } = await supabase
      .from("sales_leads")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .eq("source", "event_signup")
      .single()

    if (existingLead) {
      return NextResponse.json(
        { error: "Lead already exists for this signup" },
        { status: 400 }
      )
    }

    // Create lead from signup
    const { data: lead, error: leadError } = await supabase
      .from("sales_leads")
      .insert({
        email: email.toLowerCase().trim(),
        phone: phone || null,
        source: "event_signup",
        status: "new",
        priority: "warm",
        dog_name: dogName || null,
        zip_code: zipCode || null,
        source_metadata: {
          event_name: eventName,
          utm_source: utmSource,
          signup_id: signupId,
        },
        contact_count: 0,
        conversion_probability: 60,
      })
      .select()
      .single()

    if (leadError) {
      console.error("Error creating lead:", leadError)
      return NextResponse.json({ error: leadError.message }, { status: 500 })
    }

    // Log activity for lead creation
    await supabase.from("sales_activities").insert({
      lead_id: lead.id,
      activity_type: "note",
      description: `Lead created from ${eventName} event signup`,
      performed_by: user.id,
      completed: true,
      completed_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, data: lead })
  } catch (error: any) {
    console.error("Error in convert-signup-to-lead API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
