#!/usr/bin/env node

/**
 * Check webhook logs and recent events to see what's failing
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkWebhookLogs() {
  console.log('🔍 Checking Webhook Logs and Recent Events...\n')

  try {
    // Get the most recent webhook event
    const { data: recentEvent, error: eventError } = await supabase
      .from('stripe_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (eventError) {
      console.error('❌ Error fetching recent event:', eventError)
      return
    }

    console.log('📋 Most Recent Webhook Event:')
    console.log(`   Event ID: ${recentEvent.id}`)
    console.log(`   Type: ${recentEvent.type}`)
    console.log(`   Created: ${recentEvent.created_at}`)
    
    if (recentEvent.payload?.data?.object?.id) {
      console.log(`   Session ID: ${recentEvent.payload.data.object.id}`)
    }
    if (recentEvent.payload?.data?.object?.metadata?.plan_id) {
      console.log(`   Plan ID: ${recentEvent.payload.data.object.metadata.plan_id}`)
    }
    if (recentEvent.payload?.data?.object?.metadata?.user_id) {
      console.log(`   User ID: ${recentEvent.payload.data.object.metadata.user_id}`)
    }
    if (recentEvent.payload?.data?.object?.subscription) {
      console.log(`   Subscription ID: ${recentEvent.payload.data.object.subscription}`)
    }

    // Check if there's a plan for this event
    const planId = recentEvent.payload?.data?.object?.metadata?.plan_id
    if (planId) {
      console.log('\n🔍 Checking Plan Status:')
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single()

      if (planError) {
        console.log(`   ❌ Plan not found: ${planError.message}`)
      } else {
        console.log(`   ✅ Plan found: ${plan.id}`)
        console.log(`   User ID: ${plan.user_id || 'NULL'}`)
        console.log(`   Status: ${plan.status}`)
        console.log(`   Stripe Session ID: ${plan.stripe_session_id || 'NULL'}`)
        console.log(`   Stripe Subscription ID: ${plan.stripe_subscription_id || 'NULL'}`)
        console.log(`   Updated: ${plan.updated_at}`)
      }
    }

    // Check if there's a subscription for this event
    const subscriptionId = recentEvent.payload?.data?.object?.subscription
    if (subscriptionId) {
      console.log('\n🔍 Checking Subscription Status:')
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('stripe_subscription_id', subscriptionId)
        .single()

      if (subError) {
        console.log(`   ❌ Subscription not found: ${subError.message}`)
        console.log('   This means the webhook failed to create the subscription!')
      } else {
        console.log(`   ✅ Subscription found: ${subscription.id}`)
        console.log(`   User ID: ${subscription.user_id}`)
        console.log(`   Plan ID: ${subscription.plan_id}`)
        console.log(`   Status: ${subscription.status}`)
        console.log(`   Created: ${subscription.created_at}`)
      }
    }

    // Check for any recent subscription creation attempts
    console.log('\n🔍 Checking Recent Subscription Creation Attempts:')
    const { data: recentSubs, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)

    if (subError) {
      console.error('   ❌ Error fetching subscriptions:', subError)
    } else {
      console.log(`   Found ${recentSubs.length} recent subscriptions:`)
      recentSubs.forEach((sub, index) => {
        const subTime = new Date(sub.created_at)
        const timeAgo = Math.round((Date.now() - subTime.getTime()) / (1000 * 60)) // minutes ago
        console.log(`   ${index + 1}. ${sub.id} - ${timeAgo} minutes ago`)
        console.log(`      User ID: ${sub.user_id}`)
        console.log(`      Plan ID: ${sub.plan_id}`)
        console.log(`      Stripe Sub ID: ${sub.stripe_subscription_id}`)
      })
    }

    console.log('\n📋 Analysis:')
    if (recentEvent && !subscriptionId) {
      console.log('🚨 ISSUE: Recent webhook event has no subscription ID')
      console.log('   This means the checkout session was completed but no subscription was created')
      console.log('   The webhook should handle this case by waiting for customer.subscription.created')
    } else if (recentEvent && subscriptionId) {
      console.log('🔍 Recent event has subscription ID - checking if subscription was created...')
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

checkWebhookLogs()
