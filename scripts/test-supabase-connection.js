#!/usr/bin/env node

/**
 * Test Supabase connection and database schema
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testSupabaseConnection() {
  console.log('🔌 Testing Supabase Connection...\n')

  try {
    // 1. Test basic connection
    console.log('1. Testing basic connection...')
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      return
    }
    console.log('✅ Connection successful!')

    // 2. Check subscriptions table schema
    console.log('\n2. Checking subscriptions table schema...')
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'subscriptions')
      .eq('table_schema', 'public')

    if (columnsError) {
      console.error('❌ Error checking schema:', columnsError)
    } else {
      console.log('✅ Subscriptions table columns:')
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
      })
    }

    // 3. Check existing subscriptions
    console.log('\n3. Checking existing subscriptions...')
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(5)

    if (subError) {
      console.error('❌ Error fetching subscriptions:', subError)
    } else {
      console.log(`✅ Found ${subscriptions.length} existing subscriptions`)
      if (subscriptions.length > 0) {
        console.log('   Sample subscription:', JSON.stringify(subscriptions[0], null, 2))
      }
    }

    // 4. Check existing plans
    console.log('\n4. Checking existing plans...')
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .limit(5)

    if (plansError) {
      console.error('❌ Error fetching plans:', plansError)
    } else {
      console.log(`✅ Found ${plans.length} existing plans`)
      if (plans.length > 0) {
        console.log('   Sample plan:', JSON.stringify(plans[0], null, 2))
      }
    }

    // 5. Check recent webhook events
    console.log('\n5. Checking recent webhook events...')
    const { data: events, error: eventsError } = await supabase
      .from('stripe_events')
      .select('type, created_at, payload->>id as event_id')
      .order('created_at', { ascending: false })
      .limit(10)

    if (eventsError) {
      console.error('❌ Error fetching webhook events:', eventsError)
    } else {
      console.log(`✅ Found ${events.length} recent webhook events`)
      events.forEach(event => {
        console.log(`   - ${event.type} at ${event.created_at} (ID: ${event.event_id})`)
      })
    }

    // 6. Test subscription creation with dummy data
    console.log('\n6. Testing subscription creation (will fail due to FK constraints)...')
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
      if (insertError.message.includes('foreign key constraint')) {
        console.log('✅ Insert failed as expected due to foreign key constraints (schema is correct)')
      } else {
        console.error('❌ Unexpected insert error:', insertError.message)
      }
    } else {
      console.log('⚠️  Insert succeeded unexpectedly')
    }

    console.log('\n🎉 Supabase connection test completed!')
    console.log('\n📋 Summary:')
    console.log(`- Connection: ✅ Working`)
    console.log(`- Subscriptions table: ${subscriptions.length} records`)
    console.log(`- Plans table: ${plans.length} records`)
    console.log(`- Webhook events: ${events.length} recent events`)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testSupabaseConnection()
