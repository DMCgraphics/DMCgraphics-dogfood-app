#!/usr/bin/env node

// Script to check plans table constraints
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPlansConstraints() {
  console.log('🔍 Checking plans table constraints...\n')

  try {
    // Get all existing plans to see what statuses are used
    const { data: plans, error } = await supabase
      .from('plans')
      .select('status')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('❌ Error fetching plans:', error)
      return
    }

    console.log('✅ Existing plan statuses:')
    const statuses = [...new Set(plans.map(p => p.status))]
    statuses.forEach(status => {
      console.log(`   - ${status}`)
    })

    // Try different status values
    const testStatuses = ['draft', 'active', 'ready_for_checkout', 'pending', 'completed', 'cancelled']
    
    console.log('\n🧪 Testing different status values...')
    
    for (const status of testStatuses) {
      try {
        const { data: testPlan, error: testError } = await supabase
          .from('plans')
          .insert({
            user_id: '00000000-0000-0000-0000-000000000000',
            dog_id: '00000000-0000-0000-0000-000000000000',
            status: status,
            current_step: 1,
            subtotal_cents: 0,
            total_cents: 0
          })
          .select('id, status')
          .single()

        if (testError) {
          console.log(`   ❌ Status '${status}': ${testError.message}`)
        } else {
          console.log(`   ✅ Status '${status}': Valid`)
          // Clean up
          await supabase.from('plans').delete().eq('id', testPlan.id)
        }
      } catch (err) {
        console.log(`   ❌ Status '${status}': ${err.message}`)
      }
    }

  } catch (error) {
    console.error('❌ Error in constraint check:', error)
  }
}

checkPlansConstraints()
