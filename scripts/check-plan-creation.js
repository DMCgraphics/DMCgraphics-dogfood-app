#!/usr/bin/env node

/**
 * Check how plans are created and if dog_id is being set
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkPlanCreation() {
  console.log('🔍 Checking Plan Creation Process...\n')

  try {
    // Get the most recent plan
    const { data: recentPlan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', 'b794c176-4186-415f-87a7-8bc4a8be8af6')
      .single()

    if (planError) {
      console.error('❌ Error fetching plan:', planError)
      return
    }

    console.log('📋 Recent Plan:')
    console.log(`   ID: ${recentPlan.id}`)
    console.log(`   User ID: ${recentPlan.user_id}`)
    console.log(`   Dog ID: ${recentPlan.dog_id}`)
    console.log(`   Status: ${recentPlan.status}`)
    console.log(`   Created: ${recentPlan.created_at}`)
    console.log(`   Updated: ${recentPlan.updated_at}`)
    console.log(`   Stripe Session ID: ${recentPlan.stripe_session_id}`)
    console.log(`   Stripe Subscription ID: ${recentPlan.stripe_subscription_id}`)

    // Get all dogs for this user
    const { data: userDogs, error: dogsError } = await supabase
      .from('dogs')
      .select('*')
      .eq('user_id', recentPlan.user_id)

    if (dogsError) {
      console.error('❌ Error fetching dogs:', dogsError)
    } else {
      console.log(`\n📋 User's Dogs (${userDogs.length} total):`)
      userDogs.forEach((dog, index) => {
        console.log(`   ${index + 1}. ${dog.name} (${dog.breed}, ${dog.age} years old)`)
        console.log(`      ID: ${dog.id}`)
        console.log(`      User ID: ${dog.user_id}`)
      })
    }

    // Check if there are any other plans for this user
    const { data: userPlans, error: userPlansError } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', recentPlan.user_id)
      .order('created_at', { ascending: false })

    if (userPlansError) {
      console.error('❌ Error fetching user plans:', userPlansError)
    } else {
      console.log(`\n📋 User's Plans (${userPlans.length} total):`)
      userPlans.forEach((plan, index) => {
        const createdTime = new Date(plan.created_at)
        const timeAgo = Math.round((Date.now() - createdTime.getTime()) / (1000 * 60)) // minutes ago
        
        console.log(`   ${index + 1}. ${plan.id} - ${timeAgo} minutes ago`)
        console.log(`      Dog ID: ${plan.dog_id}`)
        console.log(`      Status: ${plan.status}`)
        console.log(`      Stripe Session ID: ${plan.stripe_session_id}`)
      })
    }

    console.log('\n🔍 Analysis:')
    console.log('The plan has dog_id: null, which means:')
    console.log('1. Either the plan was created without a dog_id')
    console.log('2. Or the dog_id was not passed during plan creation')
    console.log('3. This needs to be fixed so the dashboard can show the correct dog name')

  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

checkPlanCreation()
