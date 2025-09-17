#!/usr/bin/env node

/**
 * Monitor for new webhook events in real-time
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function monitorRealTime() {
  console.log('🔍 Monitoring Webhook Events in Real-Time...\n')
  console.log('Press Ctrl+C to stop monitoring\n')

  let lastEventCount = 0
  let lastSubscriptionCount = 0
  let lastPlanCount = 0

  // Get initial counts
  const { data: initialEvents } = await supabase
    .from('stripe_events')
    .select('id', { count: 'exact' })
  
  const { data: initialSubscriptions } = await supabase
    .from('subscriptions')
    .select('id', { count: 'exact' })
  
  const { data: initialPlans } = await supabase
    .from('plans')
    .select('id', { count: 'exact' })

  lastEventCount = initialEvents?.length || 0
  lastSubscriptionCount = initialSubscriptions?.length || 0
  lastPlanCount = initialPlans?.length || 0

  console.log(`📊 Initial counts:`)
  console.log(`   Webhook Events: ${lastEventCount}`)
  console.log(`   Subscriptions: ${lastSubscriptionCount}`)
  console.log(`   Plans: ${lastPlanCount}`)
  console.log(`\n⏳ Monitoring for changes...\n`)

  const checkForChanges = async () => {
    try {
      // Check for new webhook events
      const { data: events } = await supabase
        .from('stripe_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      // Check for new subscriptions
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      // Check for new plans
      const { data: plans } = await supabase
        .from('plans')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(5)

      const currentEventCount = events?.length || 0
      const currentSubscriptionCount = subscriptions?.length || 0
      const currentPlanCount = plans?.length || 0

      // Check for new webhook events
      if (currentEventCount > lastEventCount) {
        console.log(`🎉 NEW WEBHOOK EVENT DETECTED!`)
        const newEvents = events.slice(0, currentEventCount - lastEventCount)
        newEvents.forEach((event, index) => {
          const eventTime = new Date(event.created_at)
          const timeAgo = Math.round((Date.now() - eventTime.getTime()) / (1000 * 60)) // minutes ago
          console.log(`   ${index + 1}. ${event.type} - ${timeAgo} minutes ago`)
          console.log(`      Event ID: ${event.id}`)
        })
        lastEventCount = currentEventCount
      }

      // Check for new subscriptions
      if (currentSubscriptionCount > lastSubscriptionCount) {
        console.log(`🎉 NEW SUBSCRIPTION CREATED!`)
        const newSubscriptions = subscriptions.slice(0, currentSubscriptionCount - lastSubscriptionCount)
        newSubscriptions.forEach((sub, index) => {
          const subTime = new Date(sub.created_at)
          const timeAgo = Math.round((Date.now() - subTime.getTime()) / (1000 * 60)) // minutes ago
          console.log(`   ${index + 1}. ${sub.id} - ${timeAgo} minutes ago`)
          console.log(`      User ID: ${sub.user_id}`)
          console.log(`      Plan ID: ${sub.plan_id}`)
          console.log(`      Stripe Sub ID: ${sub.stripe_subscription_id}`)
        })
        lastSubscriptionCount = currentSubscriptionCount
      }

      // Check for new plans
      if (currentPlanCount > lastPlanCount) {
        console.log(`🎉 NEW PLAN CREATED/UPDATED!`)
        const newPlans = plans.slice(0, currentPlanCount - lastPlanCount)
        newPlans.forEach((plan, index) => {
          const planTime = new Date(plan.updated_at)
          const timeAgo = Math.round((Date.now() - planTime.getTime()) / (1000 * 60)) // minutes ago
          console.log(`   ${index + 1}. ${plan.id} - ${timeAgo} minutes ago`)
          console.log(`      User ID: ${plan.user_id}`)
          console.log(`      Status: ${plan.status}`)
          console.log(`      Stripe Session ID: ${plan.stripe_session_id}`)
          console.log(`      Stripe Subscription ID: ${plan.stripe_subscription_id}`)
        })
        lastPlanCount = currentPlanCount
      }

      // Show current status
      const now = new Date().toLocaleTimeString()
      process.stdout.write(`\r⏰ ${now} - Events: ${currentEventCount}, Subscriptions: ${currentSubscriptionCount}, Plans: ${currentPlanCount}`)

    } catch (error) {
      console.error(`\n❌ Error checking for changes: ${error.message}`)
    }
  }

  // Check every 5 seconds
  const interval = setInterval(checkForChanges, 5000)

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Monitoring stopped')
    clearInterval(interval)
    process.exit(0)
  })

  // Initial check
  await checkForChanges()
}

monitorRealTime()
