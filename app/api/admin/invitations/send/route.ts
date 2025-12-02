import { NextResponse } from "next/server"
import { getAdminUser } from "@/lib/admin/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { Resend } from "resend"
import { generateInvitationEmailHTML, generateInvitationEmailText } from "@/lib/email/invitation-template"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type SendInvitationBody = {
  invitationId?: string
  email?: string
  batchSend?: boolean
  status?: string
}

export async function POST(req: Request) {
  try {
    // Check admin authorization
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: SendInvitationBody = await req.json()
    const { invitationId, email, batchSend, status = 'pending' } = body

    const resend = new Resend(process.env.RESEND_API_KEY)
    const supabase = supabaseAdmin

    // Determine which invitations to send
    let invitationsToSend: any[] = []

    if (batchSend) {
      // Send all pending/unsent invitations
      const { data, error } = await supabase
        .from("subscription_invitations")
        .select("*")
        .eq("status", status)
        .lte("expires_at", new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString())

      if (error) {
        console.error("[admin] Error fetching invitations:", error)
        return NextResponse.json(
          { error: "Failed to fetch invitations" },
          { status: 500 }
        )
      }

      invitationsToSend = data || []
    } else if (invitationId) {
      // Send specific invitation by ID
      const { data, error } = await supabase
        .from("subscription_invitations")
        .select("*")
        .eq("id", invitationId)
        .single()

      if (error || !data) {
        return NextResponse.json(
          { error: "Invitation not found" },
          { status: 404 }
        )
      }

      invitationsToSend = [data]
    } else if (email) {
      // Send invitation by email
      const { data, error } = await supabase
        .from("subscription_invitations")
        .select("*")
        .eq("email", email)
        .eq("status", status)
        .single()

      if (error || !data) {
        return NextResponse.json(
          { error: "Invitation not found for this email" },
          { status: 404 }
        )
      }

      invitationsToSend = [data]
    } else {
      return NextResponse.json(
        { error: "Either invitationId, email, or batchSend must be provided" },
        { status: 400 }
      )
    }

    // Send emails
    const results: any[] = []
    const errors: any[] = []

    for (const invitation of invitationsToSend) {
      try {
        // Check if already claimed or expired
        if (invitation.status === 'claimed') {
          errors.push({
            email: invitation.email,
            error: "Already claimed"
          })
          continue
        }

        if (new Date(invitation.expires_at) < new Date()) {
          errors.push({
            email: invitation.email,
            error: "Invitation expired"
          })
          continue
        }

        // Generate invite link
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/signup?invite=${invitation.token}`

        // Generate email content
        const html = generateInvitationEmailHTML({
          customerName: invitation.customer_name || '',
          inviteLink,
          expiresAt: invitation.expires_at
        })

        const text = generateInvitationEmailText({
          customerName: invitation.customer_name || '',
          inviteLink,
          expiresAt: invitation.expires_at
        })

        // Send email
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: "NouriPet <no-reply@updates.nouripet.net>",
          to: [invitation.email],
          subject: "Welcome to NouriPet - Set Up Your Account 🐾",
          html,
          text
        })

        if (emailError) {
          console.error(`[admin] Error sending email to ${invitation.email}:`, emailError)
          errors.push({
            email: invitation.email,
            error: emailError.message
          })
          continue
        }

        // Update invitation status to 'sent'
        await supabase
          .from("subscription_invitations")
          .update({
            status: 'sent',
            updated_at: new Date().toISOString()
          })
          .eq("id", invitation.id)

        results.push({
          email: invitation.email,
          emailId: emailData?.id
        })

        console.log(`[admin] Invitation email sent by ${adminUser.email} to ${invitation.email}`)
      } catch (err: any) {
        console.error(`[admin] Error processing invitation for ${invitation.email}:`, err)
        errors.push({
          email: invitation.email,
          error: err.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      sent: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error("[admin] Error sending invitations:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send invitations" },
      { status: 500 }
    )
  }
}
