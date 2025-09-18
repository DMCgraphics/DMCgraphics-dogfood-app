#!/usr/bin/env node

// Script to check subscriptions table schema
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSubscriptionsSchema() {
  console.log('🔍 Checking subscriptions table schema...\n')

  try {
    // Get all subscriptions to see the structure
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(5)

    if (subsError) {
      console.error('❌ Error fetching subscriptions:', subsError)
      return
    }

    console.log(`📊 Found ${subscriptions.length} subscriptions`)
    
    if (subscriptions.length > 0) {
      console.log('\n📋 Sample subscription structure:')
      console.log(JSON.stringify(subscriptions[0], null, 2))
    }

    // Check for subscriptions with NULL user_id
    const { data: nullSubscriptions, error: nullError } = await supabase
      .from('subscriptions')
      .select('*')
      .is('user_id', null)

    if (nullError) {
      console.error('❌ Error fetching subscriptions with NULL user_id:', nullError)
    } else {
      console.log(`\n📊 Subscriptions with NULL user_id: ${nullSubscriptions.length}`)
      nullSubscriptions.forEach(sub => {
        console.log(`   - ID: ${sub.id}, Status: ${sub.status}`)
      })
    }

  } catch (error) {
    console.error('❌ Error in schema check:', error)
  }
}

checkSubscriptionsSchema()
