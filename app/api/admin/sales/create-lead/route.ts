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

    const {
      email,
      full_name,
      phone,
      source,
      status,
      priority,
      assigned_to,
      dog_name,
      dog_weight,
      dog_breed,
      zip_code,
      notes,
    } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Validate source
    const validSources = ['event_signup', 'early_access', 'abandoned_plan', 'incomplete_checkout', 'individual_pack', 'contact_form', 'medical_request', 'manual']
    if (!validSources.includes(source)) {
      return NextResponse.json({ error: "Invalid source" }, { status: 400 })
    }

    // Validate status
    const validStatuses = ['new', 'contacted', 'qualified', 'nurturing', 'converted', 'lost', 'spam']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Validate priority
    const validPriorities = ['hot', 'warm', 'cold']
    if (!validPriorities.includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 })
    }

    // Create lead
    const { data: lead, error: leadError } = await supabase
      .from("sales_leads")
      .insert({
        email: email.toLowerCase().trim(),
        full_name: full_name || null,
        phone: phone || null,
        source,
        status,
        priority,
        assigned_to: assigned_to || null,
        assigned_at: assigned_to ? new Date().toISOString() : null,
        dog_name: dog_name || null,
        dog_weight: dog_weight || null,
        dog_breed: dog_breed || null,
        zip_code: zip_code || null,
        notes: notes || null,
        contact_count: 0,
        conversion_probability: priority === 'hot' ? 75 : priority === 'warm' ? 50 : 25,
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
      description: `Lead manually created by ${profile?.is_admin ? 'admin' : 'sales team'}`,
      performed_by: user.id,
      completed: true,
      completed_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, data: lead })
  } catch (error: any) {
    console.error("Error in create-lead API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
