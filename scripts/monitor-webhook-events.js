#!/usr/bin/env node

/**
 * Monitor for new webhook events to see if they're being received properly
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function monitorWebhookEvents() {
  console.log('🔍 Monitoring Webhook Events...\n')

  try {
    // Get the most recent webhook event timestamp
    const { data: latestEvent, error: eventError } = await supabase
      .from('stripe_events')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (eventError) {
      console.error('❌ Error fetching latest event:', eventError)
      return
    }

    const latestEventTime = new Date(latestEvent.created_at)
    const timeAgo = Math.round((Date.now() - latestEventTime.getTime()) / (1000 * 60)) // minutes ago

    console.log(`📊 Latest webhook event: ${timeAgo} minutes ago`)
    console.log(`   Time: ${latestEvent.created_at}`)

    // Get recent events (last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    
    const { data: recentEvents, error: recentError } = await supabase
      .from('stripe_events')
      .select('*')
      .gte('created_at', tenMinutesAgo)
      .order('created_at', { ascending: false })

    if (recentError) {
      console.error('❌ Error fetching recent events:', recentError)
      return
    }

    console.log(`\n🔍 Events in the last 10 minutes: ${recentEvents.length}`)

    if (recentEvents.length > 0) {
      console.log('✅ New webhook events are being received!')
      recentEvents.forEach((event, index) => {
        const eventTime = new Date(event.created_at)
        const timeAgo = Math.round((Date.now() - eventTime.getTime()) / (1000 * 60)) // minutes ago
        console.log(`   ${index + 1}. ${event.type} - ${timeAgo} minutes ago`)
        console.log(`      Event ID: ${event.id}`)
      })
    } else {
      console.log('⏳ No new webhook events in the last 10 minutes')
      console.log('   This is normal if no new checkouts have occurred')
    }

    // Check for recent subscriptions
    const { data: recentSubscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .gte('created_at', tenMinutesAgo)
      .order('created_at', { ascending: false })

    if (subError) {
      console.error('❌ Error fetching recent subscriptions:', subError)
      return
    }

    console.log(`\n🔍 Subscriptions created in the last 10 minutes: ${recentSubscriptions.length}`)

    if (recentSubscriptions.length > 0) {
      console.log('✅ New subscriptions are being created!')
      recentSubscriptions.forEach((sub, index) => {
        const subTime = new Date(sub.created_at)
        const timeAgo = Math.round((Date.now() - subTime.getTime()) / (1000 * 60)) // minutes ago
        console.log(`   ${index + 1}. ${sub.id} - ${timeAgo} minutes ago`)
        console.log(`      User ID: ${sub.user_id}`)
        console.log(`      Plan ID: ${sub.plan_id}`)
        console.log(`      Stripe Sub ID: ${sub.stripe_subscription_id}`)
      })
    } else {
      console.log('⏳ No new subscriptions created in the last 10 minutes')
    }

    // Check for recent plans
    const { data: recentPlans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .gte('updated_at', tenMinutesAgo)
      .order('updated_at', { ascending: false })

    if (plansError) {
      console.error('❌ Error fetching recent plans:', plansError)
      return
    }

    console.log(`\n🔍 Plans updated in the last 10 minutes: ${recentPlans.length}`)

    if (recentPlans.length > 0) {
      console.log('✅ New plans are being created/updated!')
      recentPlans.forEach((plan, index) => {
        const planTime = new Date(plan.updated_at)
        const timeAgo = Math.round((Date.now() - planTime.getTime()) / (1000 * 60)) // minutes ago
        console.log(`   ${index + 1}. ${plan.id} - ${timeAgo} minutes ago`)
        console.log(`      User ID: ${plan.user_id}`)
        console.log(`      Status: ${plan.status}`)
        console.log(`      Stripe Session ID: ${plan.stripe_session_id}`)
        console.log(`      Stripe Subscription ID: ${plan.stripe_subscription_id}`)
      })
    } else {
      console.log('⏳ No new plans updated in the last 10 minutes')
    }

    console.log('\n📋 Summary:')
    if (recentEvents.length > 0 && recentSubscriptions.length > 0) {
      console.log('🎉 SUCCESS: Webhook is working! New events are creating subscriptions automatically!')
    } else if (recentEvents.length > 0 && recentSubscriptions.length === 0) {
      console.log('⚠️  Webhook events are being received but subscriptions are not being created')
      console.log('   This suggests the webhook code needs further debugging')
    } else {
      console.log('⏳ No recent activity - try a new checkout to test the webhook')
    }

  } catch (error) {
    console.error('❌ Monitor failed:', error.message)
  }
}

monitorWebhookEvents()
