#!/usr/bin/env node

// Script to fix plans with NULL user_ids
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixPlansNullUserIds() {
  console.log('🔧 Fixing plans with NULL user_ids...\n')

  try {
    // Get all plans with NULL user_id
    const { data: plansWithNullUserId, error: plansError } = await supabase
      .from('plans')
      .select('id, dog_id, status, created_at')
      .is('user_id', null)

    if (plansError) {
      console.error('❌ Error fetching plans with NULL user_id:', plansError)
      return
    }

    console.log(`📊 Found ${plansWithNullUserId.length} plans with NULL user_id`)

    if (plansWithNullUserId.length === 0) {
      console.log('✅ No plans with NULL user_id found')
      return
    }

    // Fix each plan
    for (const plan of plansWithNullUserId) {
      console.log(`\n🔧 Fixing plan ${plan.id}...`)

      if (!plan.dog_id) {
        console.log(`   ❌ Plan has no dog_id, skipping`)
        continue
      }

      // Get the dog to find its user_id
      const { data: dog, error: dogError } = await supabase
        .from('dogs')
        .select('id, name, user_id')
        .eq('id', plan.dog_id)
        .single()

      if (dogError) {
        console.log(`   ❌ Error fetching dog ${plan.dog_id}: ${dogError.message}`)
        continue
      }

      if (!dog.user_id) {
        console.log(`   ❌ Dog "${dog.name}" has no user_id, skipping`)
        continue
      }

      console.log(`   📋 Dog: "${dog.name}" (User ID: ${dog.user_id})`)

      // Update the plan with the correct user_id
      const { error: updateError } = await supabase
        .from('plans')
        .update({ user_id: dog.user_id })
        .eq('id', plan.id)

      if (updateError) {
        console.log(`   ❌ Error updating plan: ${updateError.message}`)
      } else {
        console.log(`   ✅ Updated plan with user_id: ${dog.user_id}`)
      }
    }

    // Verify the fix
    console.log('\n🔍 Verifying fix...')
    const { data: remainingNullPlans, error: verifyError } = await supabase
      .from('plans')
      .select('id')
      .is('user_id', null)

    if (verifyError) {
      console.error('❌ Error verifying fix:', verifyError)
    } else {
      console.log(`✅ Plans with NULL user_id remaining: ${remainingNullPlans.length}`)
    }

  } catch (error) {
    console.error('❌ Error in fix script:', error)
  }
}

fixPlansNullUserIds()
