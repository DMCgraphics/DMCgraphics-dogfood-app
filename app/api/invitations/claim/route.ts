import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ClaimInvitationBody = {
  token: string
  userId: string
}

export async function POST(req: Request) {
  try {
    const { token, userId }: ClaimInvitationBody = await req.json()

    if (!token || !userId) {
      return NextResponse.json(
        { error: "Token and userId are required" },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabase()

    // Verify the current user matches the userId
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Fetch invitation
    const { data: invitation, error: fetchError } = await supabase
      .from("subscription_invitations")
      .select("*")
      .eq("token", token)
      .single()

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 }
      )
    }

    // Verify invitation is valid
    if (invitation.status === 'claimed') {
      return NextResponse.json(
        { error: "This invitation has already been claimed" },
        { status: 400 }
      )
    }

    const now = new Date()
    const expiresAt = new Date(invitation.expires_at)

    if (now > expiresAt) {
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 }
      )
    }

    if (invitation.status === 'cancelled') {
      return NextResponse.json(
        { error: "This invitation has been cancelled" },
        { status: 400 }
      )
    }

    // Verify email matches (case insensitive)
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        {
          error: "Email mismatch. Please sign up with the email that received the invitation.",
          expectedEmail: invitation.email
        },
        { status: 400 }
      )
    }

    // Check if subscription already exists for this user
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("stripe_subscription_id", invitation.stripe_subscription_id)
      .single()

    if (existingSubscription) {
      // Mark invitation as claimed even though subscription exists
      await supabase
        .from("subscription_invitations")
        .update({
          status: 'claimed',
          claimed_at: new Date().toISOString(),
          claimed_by_user_id: userId,
          updated_at: new Date().toISOString()
        })
        .eq("id", invitation.id)

      return NextResponse.json({
        success: true,
        message: "Subscription already exists",
        subscriptionId: existingSubscription.id
      })
    }

    // Create subscription record
    const subscriptionData = {
      user_id: userId,
      stripe_subscription_id: invitation.stripe_subscription_id,
      stripe_customer_id: invitation.stripe_customer_id,
      stripe_price_id: invitation.stripe_price_id,
      status: 'active', // Assuming active since it's from CSV
      currency: invitation.currency,
      interval: invitation.interval,
      interval_count: invitation.interval_count,
      billing_cycle: invitation.billing_cycle || 'weekly',
      current_period_start: invitation.current_period_start,
      current_period_end: invitation.current_period_end,
      metadata: {
        ...invitation.metadata,
        claimed_from_invitation: invitation.id,
        original_customer_name: invitation.customer_name,
      },
    }

    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert(subscriptionData)
      .select()
      .single()

    if (subscriptionError) {
      console.error("[invitations] Error creating subscription:", subscriptionError)
      return NextResponse.json(
        {
          error: "Failed to create subscription",
          details: subscriptionError.message
        },
        { status: 500 }
      )
    }

    // Mark invitation as claimed
    const { error: updateError } = await supabase
      .from("subscription_invitations")
      .update({
        status: 'claimed',
        claimed_at: new Date().toISOString(),
        claimed_by_user_id: userId
      })
      .eq("id", invitation.id)

    if (updateError) {
      console.error("[invitations] Error updating invitation:", updateError)
      // Don't fail the request, subscription was created
    }

    console.log(`[invitations] Subscription claimed by user ${userId} from invitation ${invitation.id}`)

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        stripeSubscriptionId: subscription.stripe_subscription_id
      }
    })
  } catch (error: any) {
    console.error("[invitations] Error claiming invitation:", error)
    return NextResponse.json(
      { error: error.message || "Failed to claim invitation" },
      { status: 500 }
    )
  }
}
