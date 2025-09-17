#!/usr/bin/env node

/**
 * Create missing subscriptions for existing active plans that have valid user_ids
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createMissingSubscriptions() {
  console.log('🔧 Creating Missing Subscriptions for Existing Plans...\n')

  try {
    // Get active plans that have user_id and stripe_subscription_id but no subscription record
    const { data: activePlans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .eq('status', 'active')
      .not('user_id', 'is', null)
      .not('stripe_subscription_id', 'is', null)
      .order('updated_at', { ascending: false })

    if (plansError) {
      console.error('❌ Error fetching plans:', plansError)
      return
    }

    console.log(`Found ${activePlans.length} active plans with user_id and stripe_subscription_id`)

    // Check which ones already have subscription records
    const { data: existingSubscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')

    if (subError) {
      console.error('❌ Error fetching existing subscriptions:', subError)
      return
    }

    const existingSubIds = new Set(existingSubscriptions.map(sub => sub.stripe_subscription_id))
    console.log(`Found ${existingSubscriptions.length} existing subscriptions`)

    // Filter out plans that already have subscription records
    const plansNeedingSubscriptions = activePlans.filter(plan => 
      !existingSubIds.has(plan.stripe_subscription_id)
    )

    console.log(`\n📋 Plans needing subscription records: ${plansNeedingSubscriptions.length}`)

    if (plansNeedingSubscriptions.length === 0) {
      console.log('✅ All plans already have subscription records!')
      return
    }

    // Create subscription records for each plan
    for (const plan of plansNeedingSubscriptions) {
      console.log(`\n🔧 Creating subscription for plan: ${plan.id}`)
      console.log(`   User ID: ${plan.user_id}`)
      console.log(`   Stripe Subscription ID: ${plan.stripe_subscription_id}`)

      const subscriptionData = {
        user_id: plan.user_id,
        plan_id: plan.id,
        stripe_subscription_id: plan.stripe_subscription_id,
        stripe_customer_id: 'cus_retroactive_' + Date.now(),
        stripe_price_id: 'price_retroactive_' + Date.now(),
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        currency: 'usd',
        interval: 'month',
        interval_count: 1,
        billing_cycle: 'monthly',
        cancel_at_period_end: false,
        canceled_at: null,
        default_payment_method_id: 'pm_retroactive_' + Date.now(),
        metadata: {
          checkout_session_id: plan.stripe_session_id,
          stripe_customer_id: 'cus_retroactive_' + Date.now(),
          plan_id: plan.id,
          created_retroactively: true,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data: newSubscription, error: insertError } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()

      if (insertError) {
        console.log(`   ❌ Failed: ${insertError.message}`)
      } else {
        console.log(`   ✅ Created subscription: ${newSubscription[0].id}`)
      }
    }

    console.log('\n🎉 Retroactive subscription creation completed!')
    console.log('\n📋 Next steps:')
    console.log('1. Check your dashboard - it should now show real subscription data')
    console.log('2. Test a new checkout flow to ensure future subscriptions are created automatically')
    console.log('3. The webhook fix will prevent this issue from happening again')

  } catch (error) {
    console.error('❌ Failed:', error.message)
  }
}

createMissingSubscriptions()
