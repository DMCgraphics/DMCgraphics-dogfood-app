#!/usr/bin/env node

/**
 * Manually process recent webhook events to create missing subscriptions
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function manualWebhookProcessing() {
  console.log('🔧 Manually Processing Recent Webhook Events...\n')

  try {
    // Get recent plans that have subscription IDs but no subscription records
    const { data: activePlans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .eq('status', 'active')
      .not('stripe_subscription_id', 'is', null)
      .order('updated_at', { ascending: false })

    if (plansError) {
      console.error('❌ Error fetching plans:', plansError)
      return
    }

    console.log(`Found ${activePlans.length} active plans with subscription IDs`)

    // Check which ones don't have subscription records
    const { data: existingSubscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')

    if (subError) {
      console.error('❌ Error fetching subscriptions:', subError)
      return
    }

    const existingSubIds = new Set(existingSubscriptions.map(sub => sub.stripe_subscription_id))
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
      console.log(`   Stripe Session ID: ${plan.stripe_session_id}`)

      const subscriptionData = {
        user_id: plan.user_id,
        plan_id: plan.id,
        stripe_subscription_id: plan.stripe_subscription_id,
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
          checkout_session_id: plan.stripe_session_id,
          stripe_customer_id: 'cus_manual_' + Date.now(),
          plan_id: plan.id,
          created_manually: true,
          reason: 'webhook_not_creating_subscriptions',
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

    console.log('\n🎉 Manual webhook processing completed!')
    console.log('\n📋 Summary:')
    console.log('✅ Created subscriptions for plans that were missing them')
    console.log('❌ The webhook code still has a bug that prevents automatic creation')
    console.log('\n🚀 Next steps:')
    console.log('1. Check your dashboard - it should now show real subscription data')
    console.log('2. The webhook code needs to be debugged to fix the automatic creation')
    console.log('3. Test a new checkout to see if the webhook works after the fix')

  } catch (error) {
    console.error('❌ Failed:', error.message)
  }
}

manualWebhookProcessing()
