#!/usr/bin/env node

/**
 * Check for recent webhook events and see if they're being processed
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkRecentWebhookEvents() {
  console.log('🔍 Checking Recent Webhook Events...\n')

  try {
    // Get all webhook events from the last 24 hours
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const { data: recentEvents, error: eventsError } = await supabase
      .from('stripe_events')
      .select('*')
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false })

    if (eventsError) {
      console.error('❌ Error fetching recent events:', eventsError)
      return
    }

    console.log(`Found ${recentEvents.length} webhook events in the last 24 hours:`)

    if (recentEvents.length === 0) {
      console.log('⚠️  No webhook events in the last 24 hours!')
      console.log('This could mean:')
      console.log('1. No new checkouts have occurred')
      console.log('2. Webhook endpoint is not receiving events')
      console.log('3. Webhook events are not being stored in the database')
      return
    }

    recentEvents.forEach((event, index) => {
      const eventTime = new Date(event.created_at)
      const timeAgo = Math.round((Date.now() - eventTime.getTime()) / (1000 * 60)) // minutes ago
      
      console.log(`\n${index + 1}. ${event.type} - ${timeAgo} minutes ago`)
      console.log(`   Event ID: ${event.id}`)
      console.log(`   Created: ${event.created_at}`)
      
      if (event.payload?.data?.object?.id) {
        console.log(`   Session ID: ${event.payload.data.object.id}`)
      }
      if (event.payload?.data?.object?.metadata?.plan_id) {
        console.log(`   Plan ID: ${event.payload.data.object.metadata.plan_id}`)
      }
      if (event.payload?.data?.object?.metadata?.user_id) {
        console.log(`   User ID: ${event.payload.data.object.metadata.user_id}`)
      }
    })

    // Check if any of these recent events resulted in subscription creation
    console.log('\n🔍 Checking if recent events created subscriptions...')
    
    const recentSessionIds = recentEvents
      .map(event => event.payload?.data?.object?.id)
      .filter(Boolean)

    if (recentSessionIds.length > 0) {
      const { data: recentSubscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .gte('created_at', yesterday.toISOString())

      if (subError) {
        console.error('❌ Error fetching recent subscriptions:', subError)
      } else {
        console.log(`Found ${recentSubscriptions.length} subscriptions created in the last 24 hours`)
        
        if (recentSubscriptions.length === 0) {
          console.log('⚠️  No subscriptions created from recent webhook events!')
          console.log('This suggests the webhook is receiving events but not creating subscriptions')
        } else {
          recentSubscriptions.forEach((sub, index) => {
            console.log(`\n${index + 1}. Subscription: ${sub.id}`)
            console.log(`   User ID: ${sub.user_id}`)
            console.log(`   Plan ID: ${sub.plan_id}`)
            console.log(`   Stripe Subscription ID: ${sub.stripe_subscription_id}`)
            console.log(`   Created: ${sub.created_at}`)
          })
        }
      }
    }

    // Check recent plans
    console.log('\n🔍 Checking recent plans...')
    const { data: recentPlans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .gte('updated_at', yesterday.toISOString())
      .order('updated_at', { ascending: false })

    if (plansError) {
      console.error('❌ Error fetching recent plans:', plansError)
    } else {
      console.log(`Found ${recentPlans.length} plans updated in the last 24 hours`)
      
      recentPlans.forEach((plan, index) => {
        console.log(`\n${index + 1}. Plan: ${plan.id}`)
        console.log(`   User ID: ${plan.user_id || 'NULL'}`)
        console.log(`   Status: ${plan.status}`)
        console.log(`   Stripe Session ID: ${plan.stripe_session_id || 'NULL'}`)
        console.log(`   Stripe Subscription ID: ${plan.stripe_subscription_id || 'NULL'}`)
        console.log(`   Updated: ${plan.updated_at}`)
      })
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

checkRecentWebhookEvents()
