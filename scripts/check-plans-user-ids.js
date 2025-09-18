#!/usr/bin/env node

// Script to check plans with missing user_ids
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPlansUserIds() {
  console.log('🔍 Checking plans with missing user_ids...\n')

  try {
    // Get all plans
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('id, user_id, dog_id, status, created_at')
      .order('created_at', { ascending: false })

    if (plansError) {
      console.error('❌ Error fetching plans:', plansError)
      return
    }

    console.log(`📊 Total plans: ${plans.length}`)

    // Check for plans with NULL user_id
    const plansWithNullUserId = plans.filter(p => !p.user_id)
    console.log(`❌ Plans with NULL user_id: ${plansWithNullUserId.length}`)

    if (plansWithNullUserId.length > 0) {
      console.log('\n🔍 Plans with NULL user_id:')
      plansWithNullUserId.forEach(plan => {
        console.log(`   - ID: ${plan.id}`)
        console.log(`     Dog ID: ${plan.dog_id}`)
        console.log(`     Status: ${plan.status}`)
        console.log(`     Created: ${plan.created_at}`)
        console.log('')
      })
    }

    // Check for plans with valid user_id
    const plansWithValidUserId = plans.filter(p => p.user_id)
    console.log(`✅ Plans with valid user_id: ${plansWithValidUserId.length}`)

    // Check recent plans specifically
    const recentPlans = plans.slice(0, 10)
    console.log('\n🔍 Recent 10 plans:')
    recentPlans.forEach((plan, index) => {
      const hasUserId = plan.user_id ? '✅' : '❌'
      console.log(`   ${index + 1}. ${hasUserId} User ID: ${plan.user_id || 'NULL'} | Status: ${plan.status} | Created: ${plan.created_at}`)
    })

    // Check if there are any patterns
    const nullUserIdByStatus = {}
    plansWithNullUserId.forEach(plan => {
      nullUserIdByStatus[plan.status] = (nullUserIdByStatus[plan.status] || 0) + 1
    })

    if (Object.keys(nullUserIdByStatus).length > 0) {
      console.log('\n📊 NULL user_id by status:')
      Object.entries(nullUserIdByStatus).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count} plans`)
      })
    }

    // Check if there are any dogs associated with these plans
    if (plansWithNullUserId.length > 0) {
      console.log('\n🔍 Checking dogs associated with NULL user_id plans...')
      
      for (const plan of plansWithNullUserId.slice(0, 5)) { // Check first 5
        if (plan.dog_id) {
          const { data: dog, error: dogError } = await supabase
            .from('dogs')
            .select('id, name, user_id')
            .eq('id', plan.dog_id)
            .single()

          if (dogError) {
            console.log(`   ❌ Error fetching dog ${plan.dog_id}: ${dogError.message}`)
          } else {
            console.log(`   📋 Plan ${plan.id}: Dog "${dog.name}" (User ID: ${dog.user_id || 'NULL'})`)
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error in user_id check:', error)
  }
}

checkPlansUserIds()
