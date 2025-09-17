#!/usr/bin/env node

/**
 * Check the billing_cycle constraint values
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkBillingCycleConstraint() {
  console.log('🔍 Checking billing_cycle constraint...\n')

  try {
    // Test different billing_cycle values to see which ones are allowed
    const testValues = [
      'monthly',
      'month', 
      'weekly',
      'quarterly',
      'yearly',
      'day',
      undefined,
      null,
      'invalid'
    ]

    console.log('🧪 Testing billing_cycle values:')
    
    for (const testValue of testValues) {
      const testData = {
        user_id: 'test-user-id',
        plan_id: 'test-plan-id',
        stripe_subscription_id: 'sub_test_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        stripe_customer_id: 'cus_test_' + Date.now(),
        stripe_price_id: 'price_test_' + Date.now(),
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        currency: 'usd',
        interval: 'month',
        interval_count: 1,
        billing_cycle: testValue,
        cancel_at_period_end: false,
        canceled_at: null,
        default_payment_method_id: 'pm_test_' + Date.now(),
        metadata: { test: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log(`\n   Testing: "${testValue}"`)
      
      const { data: result, error } = await supabase
        .from('subscriptions')
        .insert(testData)
        .select()

      if (error) {
        console.log(`   ❌ Failed: ${error.message}`)
      } else {
        console.log(`   ✅ Success: ${result[0].id}`)
        // Clean up
        await supabase
          .from('subscriptions')
          .delete()
          .eq('id', result[0].id)
      }
    }

    console.log('\n📋 Summary:')
    console.log('The billing_cycle constraint is preventing subscription creation')
    console.log('We need to ensure we only use valid billing_cycle values')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

checkBillingCycleConstraint()
