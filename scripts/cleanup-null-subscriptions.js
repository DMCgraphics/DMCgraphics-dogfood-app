#!/usr/bin/env node

// Script to clean up subscriptions with NULL user_id
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanupNullSubscriptions() {
  console.log('🧹 Cleaning up subscriptions with NULL user_id...\n')

  try {
    // Get all subscriptions with NULL user_id
    const { data: nullSubscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('id, user_id, dog_id, status')
      .is('user_id', null)

    if (subsError) {
      console.error('❌ Error fetching subscriptions with NULL user_id:', subsError)
      return
    }

    console.log(`📊 Found ${nullSubscriptions.length} subscriptions with NULL user_id`)

    if (nullSubscriptions.length === 0) {
      console.log('✅ No subscriptions with NULL user_id found')
      return
    }

    // Delete each subscription with NULL user_id
    for (const sub of nullSubscriptions) {
      console.log(`\n🧹 Deleting subscription ${sub.id} (Status: ${sub.status})...`)

      const { error: deleteError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', sub.id)

      if (deleteError) {
        console.log(`   ❌ Error deleting subscription: ${deleteError.message}`)
      } else {
        console.log(`   ✅ Deleted subscription ${sub.id}`)
      }
    }

    // Verify cleanup
    console.log('\n🔍 Verifying cleanup...')
    const { data: remainingNullSubs, error: verifyError } = await supabase
      .from('subscriptions')
      .select('id')
      .is('user_id', null)

    if (verifyError) {
      console.error('❌ Error verifying cleanup:', verifyError)
    } else {
      console.log(`✅ Subscriptions with NULL user_id remaining: ${remainingNullSubs.length}`)
    }

  } catch (error) {
    console.error('❌ Error in cleanup script:', error)
  }
}

cleanupNullSubscriptions()
