import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabase()

    // Fetch invitation by token
    const { data: invitation, error } = await supabase
      .from("subscription_invitations")
      .select("id, email, customer_name, status, expires_at, claimed_at")
      .eq("token", token)
      .single()

    if (error || !invitation) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invalid invitation token"
        },
        { status: 404 }
      )
    }

    // Check if already claimed
    if (invitation.status === 'claimed') {
      return NextResponse.json(
        {
          valid: false,
          error: "This invitation has already been claimed",
          claimedAt: invitation.claimed_at
        },
        { status: 400 }
      )
    }

    // Check if expired
    const now = new Date()
    const expiresAt = new Date(invitation.expires_at)

    if (now > expiresAt) {
      return NextResponse.json(
        {
          valid: false,
          error: "This invitation has expired",
          expiredAt: invitation.expires_at
        },
        { status: 400 }
      )
    }

    // Check if cancelled
    if (invitation.status === 'cancelled') {
      return NextResponse.json(
        {
          valid: false,
          error: "This invitation has been cancelled"
        },
        { status: 400 }
      )
    }

    // Valid invitation
    return NextResponse.json({
      valid: true,
      invitation: {
        email: invitation.email,
        customerName: invitation.customer_name,
        expiresAt: invitation.expires_at
      }
    })
  } catch (error: any) {
    console.error("[invitations] Error verifying invitation:", error)
    return NextResponse.json(
      { error: error.message || "Failed to verify invitation" },
      { status: 500 }
    )
  }
}
