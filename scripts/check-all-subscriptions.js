#!/usr/bin/env node

/**
 * Check all subscriptions in the database
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAllSubscriptions() {
  console.log('🔍 Checking All Subscriptions...\n')

  try {
    // Get all subscriptions
    const { data: allSubs, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (subError) {
      console.error('❌ Error fetching subscriptions:', subError)
      return
    }

    console.log(`📋 Found ${allSubs.length} subscriptions:`)
    
    for (const sub of allSubs) {
      const createdTime = new Date(sub.created_at)
      const timeAgo = Math.round((Date.now() - createdTime.getTime()) / (1000 * 60)) // minutes ago
      
      console.log(`\n${sub.id} - ${timeAgo} minutes ago`)
      console.log(`   Stripe Subscription ID: ${sub.stripe_subscription_id}`)
      console.log(`   User ID: ${sub.user_id}`)
      console.log(`   Plan ID: ${sub.plan_id}`)
      console.log(`   Status: ${sub.status}`)
      console.log(`   Billing Cycle: ${sub.billing_cycle}`)
      console.log(`   Current Period End: ${sub.current_period_end}`)
      
      // Get the plan for this subscription
      if (sub.plan_id) {
        const { data: plan, error: planError } = await supabase
          .from('plans')
          .select('*')
          .eq('id', sub.plan_id)
          .single()

        if (planError) {
          console.log(`   ❌ Plan not found: ${planError.message}`)
        } else {
          console.log(`   ✅ Plan found:`)
          console.log(`      Dog ID: ${plan.dog_id}`)
          console.log(`      Status: ${plan.status}`)
          
          // Get the dog
          if (plan.dog_id) {
            const { data: dog, error: dogError } = await supabase
              .from('dogs')
              .select('*')
              .eq('id', plan.dog_id)
              .single()

            if (dogError) {
              console.log(`      ❌ Dog not found: ${dogError.message}`)
            } else {
              console.log(`      ✅ Dog: ${dog.name} (${dog.breed}, ${dog.age} years old)`)
            }
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

checkAllSubscriptions()
