#!/usr/bin/env node

/**
 * Test the new checkout flow to ensure subscriptions are created automatically
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testNewCheckoutFlow() {
  console.log('🧪 Testing New Checkout Flow...\n')

  try {
    // Check current state
    console.log('📊 Current State:')
    
    const { data: currentSubscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (subError) {
      console.error('❌ Error fetching subscriptions:', subError)
      return
    }

    console.log(`   Subscriptions: ${currentSubscriptions.length}`)
    currentSubscriptions.forEach((sub, index) => {
      const subTime = new Date(sub.created_at)
      const timeAgo = Math.round((Date.now() - subTime.getTime()) / (1000 * 60)) // minutes ago
      console.log(`   ${index + 1}. ${sub.id} - ${timeAgo} minutes ago`)
    })

    const { data: currentPlans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })

    if (plansError) {
      console.error('❌ Error fetching plans:', plansError)
      return
    }

    console.log(`   Active Plans: ${currentPlans.length}`)
    currentPlans.forEach((plan, index) => {
      const planTime = new Date(plan.updated_at)
      const timeAgo = Math.round((Date.now() - planTime.getTime()) / (1000 * 60)) // minutes ago
      console.log(`   ${index + 1}. ${plan.id} - ${timeAgo} minutes ago`)
    })

    // Check recent webhook events
    console.log('\n🔍 Recent Webhook Events:')
    const { data: recentEvents, error: eventsError } = await supabase
      .from('stripe_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)

    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError)
      return
    }

    console.log(`   Found ${recentEvents.length} recent events:`)
    recentEvents.forEach((event, index) => {
      const eventTime = new Date(event.created_at)
      const timeAgo = Math.round((Date.now() - eventTime.getTime()) / (1000 * 60)) // minutes ago
      console.log(`   ${index + 1}. ${event.type} - ${timeAgo} minutes ago`)
    })

    console.log('\n📋 Next Steps:')
    console.log('1. Remove the preview webhook endpoint from Stripe dashboard')
    console.log('2. Test a new checkout flow')
    console.log('3. Check that the webhook creates a subscription automatically')
    console.log('4. Verify the dashboard shows real data')

    console.log('\n🎯 Expected Behavior After Fix:')
    console.log('✅ New checkout → Webhook receives event → Subscription created automatically')
    console.log('✅ Dashboard shows real subscription data')
    console.log('✅ No more mock data')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testNewCheckoutFlow()
