#!/usr/bin/env node

/**
 * Test script to verify subscription creation works properly
 * This script helps debug subscription creation issues by testing the database schema
 * and simulating the data that would be inserted by the webhook
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
const fs = require('fs')
const path = require('path')

// Try to load .env.local file
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
      process.env[key.trim()] = value.trim()
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testSubscriptionCreation() {
  console.log('🧪 Testing subscription creation...\n')

  try {
    // 1. Check if subscriptions table exists and has the right columns
    console.log('1. Checking subscriptions table schema...')
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'subscriptions')
      .eq('table_schema', 'public')

    if (columnsError) {
      console.error('❌ Error checking table schema:', columnsError)
      return
    }

    console.log('✅ Subscriptions table columns:')
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })

    // 2. Check if there are any existing subscriptions
    console.log('\n2. Checking existing subscriptions...')
    const { data: existingSubs, error: existingError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(5)

    if (existingError) {
      console.error('❌ Error fetching existing subscriptions:', existingError)
    } else {
      console.log(`✅ Found ${existingSubs.length} existing subscriptions`)
      if (existingSubs.length > 0) {
        console.log('   Sample subscription:', JSON.stringify(existingSubs[0], null, 2))
      }
    }

    // 3. Check if there are any plans
    console.log('\n3. Checking existing plans...')
    const { data: existingPlans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .limit(5)

    if (plansError) {
      console.error('❌ Error fetching existing plans:', plansError)
    } else {
      console.log(`✅ Found ${existingPlans.length} existing plans`)
      if (existingPlans.length > 0) {
        console.log('   Sample plan:', JSON.stringify(existingPlans[0], null, 2))
      }
    }

    // 4. Test inserting a subscription (this will fail due to foreign key constraints, but that's expected)
    console.log('\n4. Testing subscription insert (expected to fail due to FK constraints)...')
    const testSubscriptionData = {
      user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      plan_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      stripe_subscription_id: 'sub_test_' + Date.now(),
      stripe_customer_id: 'cus_test_' + Date.now(),
      stripe_price_id: 'price_test_' + Date.now(),
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      currency: 'usd',
      interval: 'month',
      interval_count: 1,
      cancel_at_period_end: false,
      canceled_at: null,
      default_payment_method_id: 'pm_test_' + Date.now(),
      metadata: {
        test: true,
        created_by: 'test_script'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error: insertError } = await supabase
      .from('subscriptions')
      .insert(testSubscriptionData)

    if (insertError) {
      if (insertError.message.includes('foreign key constraint')) {
        console.log('✅ Insert failed as expected due to foreign key constraints (this is good - schema is correct)')
        console.log('   Error:', insertError.message)
      } else {
        console.error('❌ Unexpected insert error:', insertError)
      }
    } else {
      console.log('⚠️  Insert succeeded unexpectedly - this might indicate missing constraints')
    }

    // 5. Check webhook events
    console.log('\n5. Checking recent webhook events...')
    const { data: webhookEvents, error: webhookError } = await supabase
      .from('stripe_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (webhookError) {
      console.error('❌ Error fetching webhook events:', webhookError)
    } else {
      console.log(`✅ Found ${webhookEvents.length} recent webhook events`)
      webhookEvents.forEach(event => {
        console.log(`   - ${event.type} at ${event.created_at}`)
      })
    }

    console.log('\n🎉 Test completed!')
    console.log('\nNext steps:')
    console.log('1. If subscriptions table is empty, check webhook logs for errors')
    console.log('2. Verify Stripe webhook endpoint is configured correctly')
    console.log('3. Test a real checkout flow and monitor the logs')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testSubscriptionCreation()
