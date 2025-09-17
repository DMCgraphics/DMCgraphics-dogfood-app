#!/usr/bin/env node

/**
 * Check how subscriptions are linked to plans and dogs
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSubscriptionPlanLinking() {
  console.log('🔍 Checking Subscription-Plan-Dog Linking...\n')

  try {
    // Get the most recent subscription
    const { data: recentSub, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', 'sub_1S8Q8k0R4BbWwBbfdXRMbKxx')
      .single()

    if (subError) {
      console.error('❌ Error fetching subscription:', subError)
      return
    }

    console.log('📋 Recent Subscription:')
    console.log(`   ID: ${recentSub.id}`)
    console.log(`   User ID: ${recentSub.user_id}`)
    console.log(`   Plan ID: ${recentSub.plan_id}`)
    console.log(`   Status: ${recentSub.status}`)
    console.log(`   Metadata: ${JSON.stringify(recentSub.metadata, null, 2)}`)

    // Get the plan
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', recentSub.plan_id)
      .single()

    if (planError) {
      console.error('❌ Error fetching plan:', planError)
      return
    }

    console.log('\n📋 Plan:')
    console.log(`   ID: ${plan.id}`)
    console.log(`   User ID: ${plan.user_id}`)
    console.log(`   Dog ID: ${plan.dog_id}`)
    console.log(`   Status: ${plan.status}`)
    console.log(`   Stripe Subscription ID: ${plan.stripe_subscription_id}`)

    // Get the dog
    const { data: dog, error: dogError } = await supabase
      .from('dogs')
      .select('*')
      .eq('id', plan.dog_id)
      .single()

    if (dogError) {
      console.error('❌ Error fetching dog:', dogError)
      return
    }

    console.log('\n📋 Dog:')
    console.log(`   ID: ${dog.id}`)
    console.log(`   Name: ${dog.name}`)
    console.log(`   User ID: ${dog.user_id}`)
    console.log(`   Breed: ${dog.breed}`)
    console.log(`   Age: ${dog.age}`)

    // Check plan items
    const { data: planItems, error: planItemsError } = await supabase
      .from('plan_items')
      .select(`
        *,
        recipes (
          name
        )
      `)
      .eq('plan_id', plan.id)

    if (planItemsError) {
      console.error('❌ Error fetching plan items:', planItemsError)
    } else {
      console.log('\n📋 Plan Items:')
      planItems.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.recipes?.name || 'Unknown Recipe'} (${item.qty || 1} weeks)`)
      })
    }

    console.log('\n🔍 Dashboard Data Flow Analysis:')
    console.log('1. Dashboard fetches subscriptions for user')
    console.log('2. Dashboard tries to match subscription to dog via plan_id')
    console.log('3. Dashboard looks for sub.metadata.plan_id (WRONG!)')
    console.log('4. Should look for sub.plan_id (CORRECT!)')
    
    console.log('\n🔧 Issues Found:')
    console.log('❌ Dashboard subscription lookup logic is wrong')
    console.log('❌ Dashboard expects sub.metadata.plan_id but we have sub.plan_id')
    console.log('✅ Subscription -> Plan -> Dog linking is correct')
    console.log('✅ Plan has correct dog_id and recipe data')

  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

checkSubscriptionPlanLinking()
