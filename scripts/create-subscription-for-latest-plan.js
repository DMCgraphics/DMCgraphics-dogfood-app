#!/usr/bin/env node

/**
 * Create subscription for the latest plan that was just created
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createSubscriptionForLatestPlan() {
  console.log('🔧 Creating Subscription for Latest Plan...\n')

  try {
    // Get the most recent plan
    const { data: latestPlan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('status', 'active')
      .not('stripe_subscription_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (planError) {
      console.error('❌ Error fetching latest plan:', planError)
      return
    }

    console.log('📋 Latest Plan:')
    console.log(`   Plan ID: ${latestPlan.id}`)
    console.log(`   User ID: ${latestPlan.user_id}`)
    console.log(`   Status: ${latestPlan.status}`)
    console.log(`   Stripe Session ID: ${latestPlan.stripe_session_id}`)
    console.log(`   Stripe Subscription ID: ${latestPlan.stripe_subscription_id}`)
    console.log(`   Updated: ${latestPlan.updated_at}`)

    // Check if subscription already exists
    const { data: existingSub, error: subCheckError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', latestPlan.stripe_subscription_id)
      .single()

    if (existingSub) {
      console.log(`\n✅ Subscription already exists: ${existingSub.id}`)
      return
    }

    // Create subscription
    const subscriptionData = {
      user_id: latestPlan.user_id,
      plan_id: latestPlan.id,
      stripe_subscription_id: latestPlan.stripe_subscription_id,
      stripe_customer_id: 'cus_manual_' + Date.now(),
      stripe_price_id: 'price_manual_' + Date.now(),
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      currency: 'usd',
      interval: 'month',
      interval_count: 1,
      billing_cycle: 'monthly',
      cancel_at_period_end: false,
      canceled_at: null,
      default_payment_method_id: 'pm_manual_' + Date.now(),
      metadata: {
        checkout_session_id: latestPlan.stripe_session_id,
        stripe_customer_id: 'cus_manual_' + Date.now(),
        plan_id: latestPlan.id,
        created_manually: true,
        reason: 'webhook_not_receiving_events',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log(`\n🔧 Creating subscription...`)
    const { data: newSubscription, error: insertError } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()

    if (insertError) {
      console.log(`   ❌ Failed: ${insertError.message}`)
    } else {
      console.log(`   ✅ Created subscription: ${newSubscription[0].id}`)
      console.log(`\n🎉 Subscription created successfully!`)
      console.log(`\n📋 Next steps:`)
      console.log(`1. Check your dashboard - it should now show this subscription`)
      console.log(`2. Fix the webhook configuration in Stripe dashboard`)
      console.log(`3. Test a new checkout to ensure webhook works`)
    }

  } catch (error) {
    console.error('❌ Failed:', error.message)
  }
}

createSubscriptionForLatestPlan()
