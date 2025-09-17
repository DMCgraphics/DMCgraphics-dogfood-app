#!/usr/bin/env node

/**
 * Debug webhook timing and plan/subscription relationship
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugWebhookTiming() {
  console.log('🔍 Debugging Webhook Timing and Plan/Subscription Relationship...\n')

  try {
    // 1. Check recent webhook events
    console.log('1. Recent webhook events:')
    const { data: events, error: eventsError } = await supabase
      .from('stripe_events')
      .select('type, created_at, payload')
      .order('created_at', { ascending: false })
      .limit(5)

    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError)
    } else {
      events.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.type} at ${event.created_at}`)
        if (event.payload?.data?.object?.id) {
          console.log(`      Session ID: ${event.payload.data.object.id}`)
        }
        if (event.payload?.data?.object?.metadata?.plan_id) {
          console.log(`      Plan ID: ${event.payload.data.object.metadata.plan_id}`)
        }
        if (event.payload?.data?.object?.subscription) {
          console.log(`      Subscription ID: ${event.payload.data.object.subscription}`)
        }
      })
    }

    // 2. Check active plans
    console.log('\n2. Active plans:')
    const { data: activePlans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })

    if (plansError) {
      console.error('❌ Error fetching plans:', plansError)
    } else {
      console.log(`   Found ${activePlans.length} active plans:`)
      activePlans.forEach((plan, index) => {
        console.log(`   ${index + 1}. Plan ID: ${plan.id}`)
        console.log(`      User ID: ${plan.user_id}`)
        console.log(`      Status: ${plan.status}`)
        console.log(`      Stripe Session ID: ${plan.stripe_session_id}`)
        console.log(`      Stripe Subscription ID: ${plan.stripe_subscription_id}`)
        console.log(`      Updated: ${plan.updated_at}`)
      })
    }

    // 3. Check subscriptions
    console.log('\n3. Subscriptions:')
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (subError) {
      console.error('❌ Error fetching subscriptions:', subError)
    } else {
      console.log(`   Found ${subscriptions.length} subscriptions:`)
      subscriptions.forEach((sub, index) => {
        console.log(`   ${index + 1}. Subscription ID: ${sub.id}`)
        console.log(`      Stripe Subscription ID: ${sub.stripe_subscription_id}`)
        console.log(`      Plan ID: ${sub.plan_id}`)
        console.log(`      User ID: ${sub.user_id}`)
        console.log(`      Status: ${sub.status}`)
        console.log(`      Created: ${sub.created_at}`)
      })
    }

    // 4. Check for mismatched data
    console.log('\n4. Analyzing data relationships:')
    
    if (activePlans && activePlans.length > 0 && subscriptions && subscriptions.length === 0) {
      console.log('   ❌ PROBLEM FOUND: Active plans exist but no subscriptions created')
      console.log('   This suggests the webhook is not creating subscription records')
      
      // Check if plans have stripe_subscription_id
      const plansWithSubId = activePlans.filter(plan => plan.stripe_subscription_id)
      const plansWithoutSubId = activePlans.filter(plan => !plan.stripe_subscription_id)
      
      console.log(`   - Plans with Stripe Subscription ID: ${plansWithSubId.length}`)
      console.log(`   - Plans without Stripe Subscription ID: ${plansWithoutSubId.length}`)
      
      if (plansWithSubId.length > 0) {
        console.log('   ❌ Plans have Stripe Subscription IDs but no subscription records exist')
        console.log('   This indicates the webhook is failing to create subscription records')
      }
    }

    // 5. Check recent events for subscription creation attempts
    console.log('\n5. Checking for subscription creation events:')
    const { data: subEvents, error: subEventsError } = await supabase
      .from('stripe_events')
      .select('type, created_at')
      .eq('type', 'customer.subscription.created')
      .order('created_at', { ascending: false })
      .limit(5)

    if (subEventsError) {
      console.error('❌ Error fetching subscription events:', subEventsError)
    } else {
      console.log(`   Found ${subEvents.length} customer.subscription.created events`)
      subEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.created_at}`)
      })
    }

    console.log('\n📋 Summary:')
    console.log(`- Webhook events: ${events?.length || 0}`)
    console.log(`- Active plans: ${activePlans?.length || 0}`)
    console.log(`- Subscriptions: ${subscriptions?.length || 0}`)
    console.log(`- Subscription creation events: ${subEvents?.length || 0}`)

    if (activePlans?.length > 0 && subscriptions?.length === 0) {
      console.log('\n🚨 ISSUE IDENTIFIED:')
      console.log('The webhook is receiving checkout.session.completed events and creating active plans,')
      console.log('but it is NOT creating subscription records. This suggests:')
      console.log('1. The webhook subscription creation logic is failing silently')
      console.log('2. There may be missing data (user_id, plan_id) in the webhook payload')
      console.log('3. The webhook may not be receiving customer.subscription.created events')
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message)
  }
}

debugWebhookTiming()
