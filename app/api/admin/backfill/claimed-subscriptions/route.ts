import { NextResponse } from "next/server"
import { createServerSupabase, supabaseAdmin } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 minutes

export async function POST(req: Request) {
  try {
    // Check admin permission
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin, roles")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin && !profile?.roles?.includes('admin')) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    console.log("[backfill] Finding claimed subscriptions without plans...")

    // Find subscriptions claimed from invitations that don't have plans
    const { data: subscriptions, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .not("metadata->>claimed_from_invitation", "is", null)
      .is("plan_id", null)

    if (error) {
      console.error("[backfill] Error fetching subscriptions:", error)
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 }
      )
    }

    console.log(`[backfill] Found ${subscriptions.length} subscriptions to backfill`)

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as any[]
    }

    for (const sub of subscriptions) {
      results.processed++
      try {
        console.log(`\n[backfill] Processing subscription ${sub.id} (${sub.stripe_subscription_id})...`)

        // Fetch Stripe subscription
        const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id, {
          expand: ['items.data.price.product']
        })

        const totalCents = stripeSub.items.data[0].price.unit_amount || 0

        // Create plan
        const { data: plan, error: planError } = await supabaseAdmin
          .from("plans")
          .insert({
            user_id: sub.user_id,
            status: sub.status === 'active' ? 'active' : 'inactive',
            total_cents: totalCents,
            delivery_zipcode: sub.metadata?.zipcode || null,
            stripe_subscription_id: sub.stripe_subscription_id,
            snapshot: {
              total_cents: totalCents,
              recipes: [],
              billing_cycle: sub.billing_cycle
            },
            created_at: sub.created_at,
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (planError) {
          console.error(`[backfill] Failed to create plan: ${planError.message}`)
          results.failed++
          results.errors.push({
            subscription_id: sub.id,
            error: `Failed to create plan: ${planError.message}`
          })
          continue
        }

        console.log(`[backfill] Created plan ${plan.id}`)

        // Link subscription to plan
        await supabaseAdmin
          .from("subscriptions")
          .update({
            plan_id: plan.id,
            current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString()
          })
          .eq("id", sub.id)

        console.log(`[backfill] Linked subscription to plan and synced period dates`)

        // Hardcoded recipes for known users (provided by admin)
        const knownUserRecipes: Record<string, string[]> = {
          '7aeecb32-62c2-4450-8069-ae28ddce9bd8': ['Lamb & Pumpkin Feast', 'Beef & Quinoa Harvest', 'Chicken & Garden Veggie'], // Brianna Garus
          'dad94c2b-6715-4acf-8cac-e1d293217b9a': ['Beef & Quinoa Harvest', 'Lamb & Pumpkin Feast'] // Mike Nass
        }

        let recipeNames: string[] = knownUserRecipes[sub.user_id] || []

        // If not in hardcoded list, try to get from metadata or Stripe
        if (recipeNames.length === 0) {
          const recipeData = sub.metadata?.recipes || stripeSub.items.data[0].price.product.metadata?.recipes

          if (recipeData) {
            if (typeof recipeData === 'string') {
              try {
                const parsed = JSON.parse(recipeData)
                recipeNames = Array.isArray(parsed) ? parsed : [parsed]
              } catch {
                recipeNames = [recipeData]
              }
            } else if (Array.isArray(recipeData)) {
              recipeNames = recipeData
            }
          }
        }

        // Fetch recipes from database
        if (recipeNames.length > 0) {
          const { data: recipes } = await supabaseAdmin
            .from("recipes")
            .select("id, name, slug")
            .in("name", recipeNames)

          if (recipes && recipes.length > 0) {
            const planItems = recipes.map(recipe => ({
              plan_id: plan.id,
              recipe_id: recipe.id,
              qty: 1,
              unit_price_cents: Math.floor(totalCents / recipes.length),
              stripe_price_id: stripeSub.items.data[0].price.id,
              billing_interval: stripeSub.items.data[0].price.recurring.interval,
              meta: {
                recipe_variety: recipes.map(r => ({
                  id: r.id,
                  name: r.name,
                  slug: r.slug
                }))
              }
            }))

            await supabaseAdmin.from("plan_items").insert(planItems)
            console.log(`[backfill] Created ${planItems.length} plan items`)
          }
        }

        // Create order if current period is active
        const now = new Date()
        const periodEnd = new Date(stripeSub.current_period_end * 1000)

        if (periodEnd >= now) {
          const deliveryDate = new Date()
          deliveryDate.setDate(deliveryDate.getDate() + 1)

          const { data: order } = await supabaseAdmin
            .from("orders")
            .insert({
              user_id: sub.user_id,
              order_number: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
              order_type: 'subscription',
              status: 'paid',
              fulfillment_status: 'looking_for_driver',
              delivery_method: 'local_delivery',
              delivery_zipcode: sub.metadata?.zipcode || '06902',
              estimated_delivery_date: deliveryDate.toISOString().split('T')[0],
              estimated_delivery_window: '9:00 AM - 5:00 PM',
              total_cents: totalCents,
              total: totalCents / 100,
              is_subscription_order: true,
              stripe_subscription_id: sub.stripe_subscription_id,
              tracking_token: crypto.randomUUID().replace(/-/g, ''),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single()

          if (order) {
            await supabaseAdmin.from('delivery_tracking_events').insert({
              order_id: order.id,
              event_type: 'looking_for_driver',
              description: 'Subscription order received. Looking for an available driver.',
              metadata: {
                subscription_id: sub.id,
                backfilled: true
              },
              created_at: new Date().toISOString()
            })
            console.log(`[backfill] Created order ${order.order_number}`)
          }
        }

        console.log(`[backfill] ✓ Successfully backfilled subscription ${sub.id}`)
        results.succeeded++

      } catch (error: any) {
        console.error(`[backfill] ✗ Failed to process subscription ${sub.id}:`, error.message)
        results.failed++
        results.errors.push({
          subscription_id: sub.id,
          error: error.message
        })
      }
    }

    console.log("\n[backfill] === Backfill complete ===")

    return NextResponse.json({
      success: true,
      message: `Backfill complete. Processed ${results.processed} subscriptions. ${results.succeeded} succeeded, ${results.failed} failed.`,
      results
    })

  } catch (error: any) {
    console.error("[backfill] Unexpected error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to run backfill" },
      { status: 500 }
    )
  }
}
