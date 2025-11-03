export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabase()

    // Get the request body
    const body = await req.json()
    const { email, condition_name, dog_name, dog_weight, notes } = body

    // Validate email
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      )
    }

    // Get authenticated user if available
    const { data: { user } } = await supabase.auth.getUser()

    // Insert the request into the database
    const { data, error } = await supabase
      .from("medical_condition_requests")
      .insert({
        email: email.toLowerCase().trim(),
        condition_name: condition_name || "Other",
        dog_name: dog_name || null,
        dog_weight: dog_weight || null,
        notes: notes || null,
        user_id: user?.id || null,
        status: "pending"
      })
      .select()
      .single()

    if (error) {
      console.error("[Medical Condition Request] Database error:", error)
      return NextResponse.json(
        { error: "Failed to save request" },
        { status: 500 }
      )
    }

    console.log("[Medical Condition Request] Successfully saved:", {
      id: data.id,
      email: data.email,
      condition: data.condition_name
    })

    return NextResponse.json({
      success: true,
      message: "Request saved successfully",
      id: data.id
    })

  } catch (error) {
    console.error("[Medical Condition Request] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
