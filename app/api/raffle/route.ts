import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

// Feature flag - set to false to disable the raffle
const RAFFLE_ENABLED = process.env.NEXT_PUBLIC_RAFFLE_ENABLED !== "false"

export async function POST(req: Request) {
  try {
    // Check if raffle is enabled
    if (!RAFFLE_ENABLED) {
      return NextResponse.json(
        { error: "Raffle is currently not active" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { dogName, email, phoneNumber, zipCode, subscribeToUpdates, utmSource } = body

    // Validate required fields
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabase()

    // Check if email already entered
    const { data: existingEntry, error: checkError } = await supabase
      .from("event_signups")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .eq("event_name", "harbor_point_raffle")
      .single()

    if (existingEntry) {
      return NextResponse.json(
        { error: "This email has already been entered in the raffle" },
        { status: 400 }
      )
    }

    // Insert new raffle entry
    const { data, error } = await supabase
      .from("event_signups")
      .insert({
        event_name: "harbor_point_raffle",
        dog_name: dogName?.trim() || null,
        email: email.toLowerCase().trim(),
        phone_number: phoneNumber?.trim() || null,
        zip_code: zipCode?.trim() || null,
        subscribe_to_updates: subscribeToUpdates,
        utm_source: utmSource || "harborpoint_event",
        metadata: {
          submitted_at: new Date().toISOString(),
          user_agent: req.headers.get("user-agent") || null,
        },
      })
      .select()
      .single()

    if (error) {
      console.error("[raffle] Database error:", error)
      return NextResponse.json(
        { error: "Failed to save entry. Please try again." },
        { status: 500 }
      )
    }

    console.log("[raffle] New entry:", { id: data.id, email: email, dogName })

    return NextResponse.json({
      success: true,
      message: "Entry submitted successfully",
    })
  } catch (error: any) {
    console.error("[raffle] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// Optional: GET endpoint to check if raffle is active
export async function GET() {
  return NextResponse.json({
    enabled: RAFFLE_ENABLED,
    event: "harbor_point_raffle",
  })
}
