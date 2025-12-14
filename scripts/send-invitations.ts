import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { Resend } from "resend"
import { generateInvitationEmailHTML, generateInvitationEmailText } from "@/lib/email/invitation-template"

// Load environment variables first
config({ path: resolve(process.cwd(), '.env.local') })

const emails = [
  "brigarus@icloud.com",
  "aivalis.family@gmail.com",
  "kcampbellrussell@gmail.com",
  "jill.k.carmichael@gmail.com"
]

async function sendInvitations() {
  // Create Supabase admin client
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const resend = new Resend(process.env.RESEND_API_KEY)
  const results = []
  const errors = []

  for (const email of emails) {
    try {
      console.log(`\nProcessing invitation for ${email}...`)

      // Get invitation from database
      const { data: invitation, error: invError } = await supabaseAdmin
        .from("subscription_invitations")
        .select("*")
        .eq("email", email)
        .single()

      if (invError || !invitation) {
        console.error(`❌ Invitation not found for ${email}`)
        console.error(`Error details:`, invError)
        errors.push({ email, error: invError?.message || "Invitation not found" })
        continue
      }

      // Check if expired
      if (new Date(invitation.expires_at) < new Date()) {
        console.error(`❌ Invitation expired for ${email}`)
        errors.push({ email, error: "Invitation expired" })
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
        to: [email],
        subject: "Welcome to NouriPet - Set Up Your Account 🐾",
        html,
        text
      })

      if (emailError) {
        console.error(`❌ Error sending email to ${email}:`, emailError)
        errors.push({ email, error: emailError.message })
        continue
      }

      console.log(`✅ Invitation sent to ${email} (Email ID: ${emailData?.id})`)
      results.push({ email, emailId: emailData?.id })

    } catch (err: any) {
      console.error(`❌ Error processing ${email}:`, err.message)
      errors.push({ email, error: err.message })
    }
  }

  console.log("\n" + "=".repeat(50))
  console.log(`✅ Successfully sent: ${results.length}`)
  console.log(`❌ Failed: ${errors.length}`)

  if (results.length > 0) {
    console.log("\nSuccessful sends:")
    results.forEach(r => console.log(`  - ${r.email}`))
  }

  if (errors.length > 0) {
    console.log("\nErrors:")
    errors.forEach(e => console.log(`  - ${e.email}: ${e.error}`))
  }

  process.exit(errors.length > 0 ? 1 : 0)
}

sendInvitations().catch(console.error)
