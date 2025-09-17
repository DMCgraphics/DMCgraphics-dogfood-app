#!/usr/bin/env node

/**
 * Test subscription creation manually with real plan data
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testSubscriptionCreationManual() {
  console.log('🧪 Testing Manual Subscription Creation with Real Plan Data...\n')

  try {
    // Get the most recent active plan with a Stripe subscription ID
    const { data: activePlans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .eq('status', 'active')
      .not('stripe_subscription_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (plansError || !activePlans || activePlans.length === 0) {
      console.log('❌ No active plans with Stripe subscription IDs found')
      return
    }

    const plan = activePlans[0]
    console.log('📋 Using plan:', plan.id)
    console.log('   User ID:', plan.user_id)
    console.log('   Stripe Subscription ID:', plan.stripe_subscription_id)
    console.log('   Stripe Session ID:', plan.stripe_session_id)

    // Test creating a subscription record manually
    const subscriptionData = {
      user_id: plan.user_id,
      plan_id: plan.id,
      stripe_subscription_id: plan.stripe_subscription_id,
      stripe_customer_id: 'cus_test_' + Date.now(),
      stripe_price_id: 'price_test_' + Date.now(),
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      currency: 'usd',
      interval: 'month',
      interval_count: 1,
      billing_cycle: 'monthly',
      cancel_at_period_end: false,
      canceled_at: null,
      default_payment_method_id: 'pm_test_' + Date.now(),
      metadata: {
        checkout_session_id: plan.stripe_session_id,
        stripe_customer_id: 'cus_test_' + Date.now(),
        plan_id: plan.id,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log('\n🔧 Attempting to create subscription record...')
    console.log('Subscription data:', JSON.stringify(subscriptionData, null, 2))

    const { data: newSubscription, error: insertError } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()

    if (insertError) {
      console.log('❌ Failed to create subscription:', insertError.message)
      console.log('Error details:', JSON.stringify(insertError, null, 2))
      
      // Check if it's a user_id issue
      if (insertError.message.includes('user_id') || !plan.user_id) {
        console.log('\n🚨 ISSUE FOUND: Missing or invalid user_id')
        console.log('The plan has user_id:', plan.user_id)
        console.log('This is likely why the webhook subscription creation is failing')
      }
    } else {
      console.log('✅ Successfully created subscription!')
      console.log('New subscription:', JSON.stringify(newSubscription, null, 2))
    }

    // Check if there are any plans with null user_id
    console.log('\n🔍 Checking for plans with null user_id...')
    const { data: nullUserPlans, error: nullUserError } = await supabase
      .from('plans')
      .select('id, user_id, status, stripe_subscription_id')
      .eq('status', 'active')
      .is('user_id', null)

    if (nullUserError) {
      console.log('❌ Error checking null user plans:', nullUserError)
    } else {
      console.log(`Found ${nullUserPlans.length} active plans with null user_id:`)
      nullUserPlans.forEach((plan, index) => {
        console.log(`   ${index + 1}. Plan ID: ${plan.id}, Stripe Sub: ${plan.stripe_subscription_id}`)
      })
      
      if (nullUserPlans.length > 0) {
        console.log('\n🚨 ROOT CAUSE IDENTIFIED:')
        console.log('Many plans have null user_id, which prevents subscription creation')
        console.log('The webhook cannot create subscriptions without a valid user_id')
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testSubscriptionCreationManual()
