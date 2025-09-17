#!/usr/bin/env node

/**
 * Analyze webhook events to understand the user_id issue
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function analyzeWebhookEvents() {
  console.log('🔍 Analyzing Webhook Events...\n')

  try {
    // Get recent webhook events
    const { data: webhookEvents, error: eventsError } = await supabase
      .from('stripe_events')
      .select('payload, created_at')
      .eq('type', 'checkout.session.completed')
      .order('created_at', { ascending: false })
      .limit(10)

    if (eventsError) {
      console.error('❌ Error fetching webhook events:', eventsError)
      return
    }

    console.log(`Found ${webhookEvents.length} recent webhook events:`)

    webhookEvents.forEach((event, index) => {
      const sessionId = event.payload?.data?.object?.id
      const planId = event.payload?.data?.object?.metadata?.plan_id
      const userId = event.payload?.data?.object?.metadata?.user_id
      const customerEmail = event.payload?.data?.object?.customer_email
      
      console.log(`\n${index + 1}. Event at ${event.created_at}`)
      console.log(`   Session ID: ${sessionId}`)
      console.log(`   Plan ID: ${planId}`)
      console.log(`   User ID: ${userId || 'MISSING'}`)
      console.log(`   Customer Email: ${customerEmail || 'MISSING'}`)
    })

    // Get all active plans
    const { data: activePlans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })

    if (plansError) {
      console.error('❌ Error fetching plans:', plansError)
      return
    }

    console.log(`\n\nFound ${activePlans.length} active plans:`)

    activePlans.forEach((plan, index) => {
      console.log(`\n${index + 1}. Plan: ${plan.id}`)
      console.log(`   User ID: ${plan.user_id || 'NULL'}`)
      console.log(`   Stripe Session ID: ${plan.stripe_session_id || 'NULL'}`)
      console.log(`   Stripe Subscription ID: ${plan.stripe_subscription_id || 'NULL'}`)
      console.log(`   Updated: ${plan.updated_at}`)
    })

    // Check for patterns
    console.log('\n\n📊 Analysis:')
    
    const eventsWithUserId = webhookEvents.filter(event => 
      event.payload?.data?.object?.metadata?.user_id
    )
    const eventsWithoutUserId = webhookEvents.filter(event => 
      !event.payload?.data?.object?.metadata?.user_id
    )
    
    const plansWithUserId = activePlans.filter(plan => plan.user_id)
    const plansWithoutUserId = activePlans.filter(plan => !plan.user_id)
    
    console.log(`- Webhook events with user_id: ${eventsWithUserId.length}`)
    console.log(`- Webhook events without user_id: ${eventsWithoutUserId.length}`)
    console.log(`- Plans with user_id: ${plansWithUserId.length}`)
    console.log(`- Plans without user_id: ${plansWithoutUserId.length}`)

    if (eventsWithoutUserId.length > 0) {
      console.log('\n🚨 ISSUE FOUND: Some webhook events are missing user_id in metadata')
      console.log('This explains why some plans have null user_id')
    }

    if (plansWithoutUserId.length > 0) {
      console.log('\n🚨 ISSUE FOUND: Some plans have null user_id')
      console.log('These plans cannot have subscriptions created for them')
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error.message)
  }
}

analyzeWebhookEvents()
