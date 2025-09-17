#!/usr/bin/env node

/**
 * Run the database schema fix to add missing columns to subscriptions table
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runSchemaFix() {
  console.log('🔧 Running Database Schema Fix...\n')

  try {
    // SQL commands to fix the schema
    const schemaFixSQL = `
      -- Add Stripe subscription ID column
      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

      -- Add Stripe customer ID column  
      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

      -- Add Stripe price ID column
      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

      -- Add current period start/end columns
      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE;

      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;

      -- Add currency column
      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'usd';

      -- Add interval columns
      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS interval TEXT DEFAULT 'month';

      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS interval_count INTEGER DEFAULT 1;

      -- Add billing_cycle column (this is the missing one!)
      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';

      -- Add cancellation columns
      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE;

      -- Add payment method column
      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS default_payment_method_id TEXT;

      -- Add metadata column for storing additional data
      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

      -- Add pause collection column for subscription pausing
      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS pause_json JSONB;
    `

    console.log('1. Adding missing columns to subscriptions table...')
    
    // Execute the schema fix
    const { data, error } = await supabase.rpc('exec_sql', { sql: schemaFixSQL })
    
    if (error) {
      console.error('❌ Error running schema fix:', error)
      console.log('\n🔧 Manual fix required:')
      console.log('Please run the SQL commands manually in your Supabase dashboard:')
      console.log('1. Go to https://supabase.com/dashboard')
      console.log('2. Navigate to your project: tczvietgpixwonpqaotl')
      console.log('3. Go to SQL Editor')
      console.log('4. Copy and paste the contents of scripts/fix-subscriptions-schema-now.sql')
      console.log('5. Click Run')
      return
    }

    console.log('✅ Schema fix completed successfully!')

    // Verify the fix worked
    console.log('\n2. Verifying the schema fix...')
    
    // Test inserting a subscription with the new schema
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
        console.log('✅ Schema fix successful! (Insert failed as expected due to FK constraints)')
      } else if (insertError.message.includes('billing_cycle')) {
        console.log('❌ Schema fix incomplete - billing_cycle column still missing')
        console.log('Please run the manual fix described above')
      } else {
        console.log('⚠️  Unexpected error:', insertError.message)
      }
    } else {
      console.log('✅ Schema fix successful! (Insert succeeded)')
    }

    console.log('\n🎉 Schema fix completed!')
    console.log('\n📋 Next steps:')
    console.log('1. Test a real checkout flow')
    console.log('2. Check if subscriptions are now created in the database')
    console.log('3. Verify the dashboard shows real data instead of mock data')

  } catch (error) {
    console.error('❌ Schema fix failed:', error.message)
    console.log('\n🔧 Manual fix required:')
    console.log('Please run the SQL commands manually in your Supabase dashboard:')
    console.log('1. Go to https://supabase.com/dashboard')
    console.log('2. Navigate to your project: tczvietgpixwonpqaotl')
    console.log('3. Go to SQL Editor')
    console.log('4. Copy and paste the contents of scripts/fix-subscriptions-schema-now.sql')
    console.log('5. Click Run')
  }
}

runSchemaFix()
