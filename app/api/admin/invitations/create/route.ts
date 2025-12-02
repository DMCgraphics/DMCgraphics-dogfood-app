import { NextResponse } from "next/server"
import { getAdminUser } from "@/lib/admin/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { randomBytes } from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type CreateInvitationBody = {
  email: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  stripePriceId?: string
  planName?: string
  quantity?: number
  currency?: string
  interval?: string
  intervalCount?: number
  amountCents?: number
  billingCycle?: string
  customerName?: string
  metadata?: Record<string, any>
  subscriptionStartDate?: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
  expiresInDays?: number
}

type CreateBatchInvitationsBody = {
  invitations: CreateInvitationBody[]
}

function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export async function POST(req: Request) {
  try {
    // Check admin authorization
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    // Check if this is a batch creation
    if ('invitations' in body && Array.isArray(body.invitations)) {
      return handleBatchCreate(body as CreateBatchInvitationsBody, adminUser.id)
    } else {
      return handleSingleCreate(body as CreateInvitationBody, adminUser.id)
    }
  } catch (error: any) {
    console.error("[admin] Error creating invitation:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create invitation" },
      { status: 500 }
    )
  }
}

async function handleSingleCreate(data: CreateInvitationBody, adminUserId: string) {
  const { email, stripeCustomerId, stripeSubscriptionId, expiresInDays = 14 } = data

  if (!email || !stripeCustomerId || !stripeSubscriptionId) {
    return NextResponse.json(
      { error: "Email, stripeCustomerId, and stripeSubscriptionId are required" },
      { status: 400 }
    )
  }

  const supabase = supabaseAdmin

  // Check if invitation already exists for this subscription
  const { data: existing } = await supabase
    .from("subscription_invitations")
    .select("id, status, email")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .single()

  if (existing) {
    if (existing.status === 'claimed') {
      return NextResponse.json(
        { error: "This subscription has already been claimed" },
        { status: 400 }
      )
    }
    // If pending or sent, we can recreate it
    console.log("[admin] Existing invitation found, will update it")
  }

  const token = generateToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  const invitationData = {
    token,
    email,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    stripe_price_id: data.stripePriceId || null,
    plan_name: data.planName || null,
    quantity: data.quantity || 1,
    currency: data.currency || 'usd',
    interval: data.interval || null,
    interval_count: data.intervalCount || null,
    amount_cents: data.amountCents || null,
    billing_cycle: data.billingCycle || null,
    customer_name: data.customerName || null,
    metadata: data.metadata || {},
    subscription_start_date: data.subscriptionStartDate || null,
    current_period_start: data.currentPeriodStart || null,
    current_period_end: data.currentPeriodEnd || null,
    status: 'pending',
    invited_by: adminUserId,
    expires_at: expiresAt.toISOString(),
  }

  const { data: invitation, error } = await supabase
    .from("subscription_invitations")
    .upsert(invitationData, {
      onConflict: 'stripe_subscription_id',
      ignoreDuplicates: false
    })
    .select()
    .single()

  if (error) {
    console.error("[admin] Error creating invitation:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create invitation" },
      { status: 500 }
    )
  }

  console.log(`[admin] Invitation created by ${adminUserId} for ${email}`)

  return NextResponse.json({
    success: true,
    invitation: {
      id: invitation.id,
      token: invitation.token,
      email: invitation.email,
      status: invitation.status,
      expiresAt: invitation.expires_at,
    }
  })
}

async function handleBatchCreate(data: CreateBatchInvitationsBody, adminUserId: string) {
  const { invitations } = data

  if (!invitations || invitations.length === 0) {
    return NextResponse.json(
      { error: "No invitations provided" },
      { status: 400 }
    )
  }

  const supabase = supabaseAdmin
  const results: any[] = []
  const errors: any[] = []

  for (const invitationData of invitations) {
    try {
      const { email, stripeCustomerId, stripeSubscriptionId, expiresInDays = 14 } = invitationData

      if (!email || !stripeCustomerId || !stripeSubscriptionId) {
        errors.push({
          email,
          error: "Missing required fields"
        })
        continue
      }

      // Check if already exists
      const { data: existing } = await supabase
        .from("subscription_invitations")
        .select("id, status")
        .eq("stripe_subscription_id", stripeSubscriptionId)
        .single()

      if (existing?.status === 'claimed') {
        errors.push({
          email,
          error: "Already claimed"
        })
        continue
      }

      const token = generateToken()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiresInDays)

      const insertData = {
        token,
        email,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_price_id: invitationData.stripePriceId || null,
        plan_name: invitationData.planName || null,
        quantity: invitationData.quantity || 1,
        currency: invitationData.currency || 'usd',
        interval: invitationData.interval || null,
        interval_count: invitationData.intervalCount || null,
        amount_cents: invitationData.amountCents || null,
        billing_cycle: invitationData.billingCycle || null,
        customer_name: invitationData.customerName || null,
        metadata: invitationData.metadata || {},
        subscription_start_date: invitationData.subscriptionStartDate || null,
        current_period_start: invitationData.currentPeriodStart || null,
        current_period_end: invitationData.currentPeriodEnd || null,
        status: 'pending',
        invited_by: adminUserId,
        expires_at: expiresAt.toISOString(),
      }

      const { data: invitation, error } = await supabase
        .from("subscription_invitations")
        .upsert(insertData, {
          onConflict: 'stripe_subscription_id',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (error) {
        errors.push({
          email,
          error: error.message
        })
      } else {
        results.push({
          id: invitation.id,
          email: invitation.email,
          token: invitation.token,
          status: invitation.status
        })
      }
    } catch (err: any) {
      errors.push({
        email: invitationData.email,
        error: err.message
      })
    }
  }

  console.log(`[admin] Batch invitation creation: ${results.length} succeeded, ${errors.length} failed`)

  return NextResponse.json({
    success: true,
    created: results.length,
    failed: errors.length,
    results,
    errors: errors.length > 0 ? errors : undefined
  })
}
