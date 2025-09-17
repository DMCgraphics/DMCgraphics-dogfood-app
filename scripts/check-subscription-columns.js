#!/usr/bin/env node

/**
 * Check what columns exist in the subscriptions table
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSubscriptionColumns() {
  console.log('🔍 Checking subscriptions table columns...\n')

  try {
    // Try to get a sample record to see what columns exist
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ Error accessing subscriptions table:', error.message)
      return
    }

    if (data && data.length > 0) {
      console.log('✅ Subscriptions table columns (from sample record):')
      Object.keys(data[0]).forEach(column => {
        console.log(`   - ${column}`)
      })
    } else {
      console.log('📝 Subscriptions table is empty, testing column creation...')
      
      // Test if we can insert with the new columns
      const testData = {
        user_id: '00000000-0000-0000-0000-000000000000',
        plan_id: '00000000-0000-0000-0000-000000000000',
        stripe_subscription_id: 'sub_test_' + Date.now(),
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
        metadata: { test: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert(testData)

      if (insertError) {
        if (insertError.message.includes('billing_cycle')) {
          console.log('❌ billing_cycle column is missing')
        } else if (insertError.message.includes('stripe_subscription_id')) {
          console.log('❌ stripe_subscription_id column is missing')
        } else if (insertError.message.includes('foreign key constraint')) {
          console.log('✅ All columns exist (insert failed due to FK constraints as expected)')
        } else {
          console.log('❌ Column error:', insertError.message)
        }
      } else {
        console.log('✅ All columns exist and insert succeeded')
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkSubscriptionColumns()
