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
      interval_count: invitation.interval_count || 1, // Default to 1 if NULL
      billing_cycle: (() => {
        const cycle = invitation.billing_cycle || invitation.interval || 'week'
        // Map Stripe interval format to our billing_cycle format
        const mapping: Record<string, string> = {
          'day': 'day',
          'week': 'weekly',
          'month': 'monthly',
          'year': 'yearly',
        }
        return mapping[cycle] || 'weekly'
      })(),
      current_period_start: invitation.current_period_start,
      current_period_end: invitation.current_period_end,
      metadata: {
        ...invitation.metadata,
        claimed_from_invitation: invitation.id,
        original_customer_name: invitation.customer_name,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert(subscriptionData)
      .select()
      .single()

    if (subscriptionError) {
      console.error("[invitations] Error creating subscription:", subscriptionError)
      console.error("[invitations] Subscription data:", subscriptionData)
      return NextResponse.json(
        {
          error: "Failed to create subscription",
          details: subscriptionError.message
        },
        { status: 500 }
      )
    }

    // Fetch Stripe subscription to get pricing
    const { stripe } = await import("@/lib/stripe")
    const stripeSubscription = await stripe.subscriptions.retrieve(
      invitation.stripe_subscription_id,
      { expand: ['items.data.price.product'] }
    )

    const stripePriceId = stripeSubscription.items.data[0].price.id
    const totalCents = stripeSubscription.items.data[0].price.unit_amount || 0

    // Check if user already has a plan with plan_items (from completing profile/plan builder)
    const { data: existingPlans } = await supabase
      .from("plans")
      .select("id, status")
      .eq("user_id", userId)
      .in("status", ["draft", "checkout_in_progress"])
      .order("created_at", { ascending: false })
      .limit(1)

    let plan: any = null
    let recipeData: any[] = []

    if (existingPlans && existingPlans.length > 0) {
      const existingPlan = existingPlans[0]

      // Fetch plan_items with recipe data
      const { data: existingPlanItems } = await supabase
        .from("plan_items")
        .select(`
          id,
          recipe_id,
          qty,
          meta,
          recipes (id, name, slug)
        `)
        .eq("plan_id", existingPlan.id)

      if (existingPlanItems && existingPlanItems.length > 0) {
        // Extract recipes from plan_items.meta.recipe_variety
        const firstItem = existingPlanItems[0]
        const recipeVariety = firstItem.meta?.recipe_variety || []

        if (recipeVariety.length > 0) {
          // User completed plan builder - use their selected recipes
          recipeData = recipeVariety
          console.log(`[invitations] Found ${recipeData.length} recipes from plan builder`)
        }

        // Update the existing plan to active with pricing and subscription
        const { data: updatedPlan } = await supabase
          .from("plans")
          .update({
            status: "active",
            total_cents: totalCents,
            delivery_zipcode: invitation.metadata?.zipcode || null,
            stripe_subscription_id: invitation.stripe_subscription_id,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingPlan.id)
          .select()
          .single()

        plan = updatedPlan

        // Update plan_items with pricing
        if (recipeData.length > 0) {
          const unitPrice = Math.floor(totalCents / recipeData.length)
          for (const item of existingPlanItems) {
            await supabase
              .from("plan_items")
              .update({
                unit_price_cents: unitPrice,
                stripe_price_id: stripePriceId,
                billing_interval: stripeSubscription.items.data[0].price.recurring.interval
              })
              .eq("id", item.id)
          }
        }
      }
    }

    // If no plan from plan builder, create new plan
    if (!plan) {
      console.log("[invitations] No existing plan found, creating new plan")

      // Get user's dog_id
      const { data: dog } = await supabase
        .from("dogs")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle()

      if (!dog) {
        console.error(`[invitations] No dog found for user ${userId}`)
        return NextResponse.json(
          { error: "No dog profile found. Please complete your dog's profile first." },
          { status: 400 }
        )
      }

      console.log(`[invitations] Found dog ${dog.id} for user ${userId}`)

      const { data: newPlan, error: planError } = await supabase
        .from("plans")
        .insert({
          user_id: userId,
          dog_id: dog.id,
          status: "active",
          total_cents: totalCents,
          delivery_zipcode: invitation.metadata?.zipcode || null,
          stripe_subscription_id: invitation.stripe_subscription_id,
          snapshot: {
            total_cents: totalCents,
            recipes: [],
            billing_cycle: subscriptionData.billing_cycle
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (planError) {
        console.error("[invitations] Error creating plan:", planError)
      } else {
        plan = newPlan

        // Try to get recipes from invitation metadata or Stripe
        const recipeMetadata = invitation.metadata?.recipes ||
          stripeSubscription.items.data[0].price.product.metadata?.recipes

        if (recipeMetadata) {
          let recipeNames: string[] = []

          if (typeof recipeMetadata === 'string') {
            try {
              const parsed = JSON.parse(recipeMetadata)
              recipeNames = Array.isArray(parsed) ? parsed.map(r => r.name || r) : [parsed]
            } catch {
              recipeNames = [recipeMetadata]
            }
          } else if (Array.isArray(recipeMetadata)) {
            recipeNames = recipeMetadata.map(r => r.name || r)
          }

          if (recipeNames.length > 0) {
            // Fetch recipe IDs from names
            const { data: recipes } = await supabase
              .from("recipes")
              .select("id, name, slug")
              .in("name", recipeNames)

            if (recipes && recipes.length > 0) {
              recipeData = recipes

              // Create plan_items for each recipe
              const unitPrice = Math.floor(totalCents / recipes.length)
              const planItems = recipes.map((recipe: any) => ({
                plan_id: plan.id,
                recipe_id: recipe.id,
                qty: 1,
                unit_price_cents: unitPrice,
                stripe_price_id: stripePriceId,
                billing_interval: stripeSubscription.items.data[0].price.recurring.interval,
                meta: {
                  recipe_variety: recipes.map(r => ({
                    id: r.id,
                    name: r.name,
                    slug: r.slug
                  }))
                }
              }))

              await supabase.from("plan_items").insert(planItems)
              console.log(`[invitations] Created ${planItems.length} plan items from metadata`)
            }
          }
        }
      }
    }

    if (plan) {
      // Link subscription to plan
      await supabase
        .from("subscriptions")
        .update({
          plan_id: plan.id,
          current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString()
        })
        .eq("id", subscription.id)

      console.log(`[invitations] Linked subscription ${subscription.id} to plan ${plan.id}`)

      // Create initial order with recipe data
      const deliveryDate = new Date()
      deliveryDate.setDate(deliveryDate.getDate() + 1) // Tomorrow

      const recipesForOrder = recipeData.map((r: any) => ({
        recipe_id: r.id,
        recipe_name: r.name,
        name: r.name,
        slug: r.slug,
        quantity: 1
      }))

      const { data: order } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          order_number: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          order_type: 'subscription',
          status: 'paid',
          fulfillment_status: 'looking_for_driver',
          delivery_method: 'local_delivery',
          delivery_zipcode: invitation.metadata?.zipcode || plan.delivery_zipcode || '06902',
          estimated_delivery_date: deliveryDate.toISOString().split('T')[0],
          estimated_delivery_window: '9:00 AM - 5:00 PM',
          total_cents: totalCents,
          total: totalCents / 100,
          recipes: recipesForOrder,
          recipe_name: recipesForOrder.map(r => r.name).join(', '),
          is_subscription_order: true,
          stripe_subscription_id: invitation.stripe_subscription_id,
          tracking_token: crypto.randomUUID().replace(/-/g, ''),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (order) {
        // Create tracking event
        await supabase.from('delivery_tracking_events').insert({
          order_id: order.id,
          event_type: 'looking_for_driver',
          description: 'Subscription order received. Looking for an available driver.',
          metadata: {
            subscription_id: subscription.id,
            stripe_subscription_id: invitation.stripe_subscription_id
          },
          created_at: new Date().toISOString()
        })
        console.log(`[invitations] Created order ${order.order_number} for subscription`)
      }
    }

    // Mark invitation as claimed
    const { error: updateError } = await supabase
      .from("subscription_invitations")
      .update({
        status: 'claimed',
        claimed_at: new Date().toISOString(),
        claimed_by_user_id: userId,
        updated_at: new Date().toISOString()
      })
      .eq("id", invitation.id)

    if (updateError) {
      console.error("[invitations] Error updating invitation:", updateError)
      // Don't fail the request, subscription was created
    }

    console.log(`[invitations] Subscription claimed by user ${userId} from invitation ${invitation.id}`)
    console.log(`[invitations] Returning subscription data:`, {
      id: subscription.id,
      status: subscription.status,
      stripeSubscriptionId: subscription.stripe_subscription_id,
      userId: subscription.user_id
    })

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
