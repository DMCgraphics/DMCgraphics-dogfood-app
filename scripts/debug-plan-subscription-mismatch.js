#!/usr/bin/env node

/**
 * Debug why plans and subscriptions don't match
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugPlanSubscriptionMismatch() {
  console.log('🔍 Debugging Plan-Subscription Mismatch...\n')

  try {
    // Get recent customer.subscription.created events
    const { data: subscriptionEvents, error: eventsError } = await supabase
      .from('stripe_events')
      .select('*')
      .eq('type', 'customer.subscription.created')
      .order('created_at', { ascending: false })
      .limit(5)

    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError)
      return
    }

    console.log(`📋 Recent customer.subscription.created Events:`)
    subscriptionEvents.forEach((event, index) => {
      const eventData = event.payload.data.object
      const eventTime = new Date(event.created_at)
      const timeAgo = Math.round((Date.now() - eventTime.getTime()) / (1000 * 60)) // minutes ago
      
      console.log(`   ${index + 1}. ${event.id} - ${timeAgo} minutes ago`)
      console.log(`      Subscription ID: ${eventData.id}`)
      console.log(`      Plan ID: ${eventData.metadata?.plan_id}`)
      console.log(`      User ID: ${eventData.metadata?.user_id}`)
      console.log(`      Customer ID: ${eventData.customer}`)
      console.log(`      Status: ${eventData.status}`)
      console.log(`      Current Period Start: ${eventData.current_period_start}`)
      console.log(`      Current Period End: ${eventData.current_period_end}`)
    })

    // Check each plan mentioned in the events
    console.log(`\n📋 Checking Plans from Events:`)
    for (const event of subscriptionEvents) {
      const eventData = event.payload.data.object
      const planId = eventData.metadata?.plan_id
      const userId = eventData.metadata?.user_id

      if (!planId) {
        console.log(`   ⚠️  Event ${event.id}: No plan_id in metadata`)
        continue
      }

      console.log(`\n🔍 Checking Plan: ${planId}`)
      
      // Check if plan exists
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single()

      if (planError) {
        console.log(`   ❌ Plan not found: ${planError.message}`)
        continue
      }

      console.log(`   ✅ Plan found:`)
      console.log(`      ID: ${planData.id}`)
      console.log(`      User ID: ${planData.user_id}`)
      console.log(`      Status: ${planData.status}`)
      console.log(`      Stripe Session ID: ${planData.stripe_session_id}`)
      console.log(`      Stripe Subscription ID: ${planData.stripe_subscription_id}`)
      console.log(`      Created: ${planData.created_at}`)
      console.log(`      Updated: ${planData.updated_at}`)

      // Check if user_id matches
      if (planData.user_id !== userId) {
        console.log(`   ⚠️  User ID mismatch:`)
        console.log(`      Plan user_id: ${planData.user_id}`)
        console.log(`      Event user_id: ${userId}`)
      } else {
        console.log(`   ✅ User ID matches: ${userId}`)
      }

      // Check if subscription ID matches
      if (planData.stripe_subscription_id !== eventData.id) {
        console.log(`   ⚠️  Subscription ID mismatch:`)
        console.log(`      Plan subscription_id: ${planData.stripe_subscription_id}`)
        console.log(`      Event subscription_id: ${eventData.id}`)
      } else {
        console.log(`   ✅ Subscription ID matches: ${eventData.id}`)
      }
    }

    // Get all active plans
    const { data: activePlans, error: activePlansError } = await supabase
      .from('plans')
      .select('*')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })

    if (activePlansError) {
      console.error('❌ Error fetching active plans:', activePlansError)
    } else {
      console.log(`\n📋 All Active Plans (${activePlans.length} total):`)
      activePlans.forEach((plan, index) => {
        const updatedTime = new Date(plan.updated_at)
        const timeAgo = Math.round((Date.now() - updatedTime.getTime()) / (1000 * 60)) // minutes ago
        
        console.log(`   ${index + 1}. ${plan.id} - ${timeAgo} minutes ago`)
        console.log(`      User ID: ${plan.user_id}`)
        console.log(`      Status: ${plan.status}`)
        console.log(`      Stripe Session ID: ${plan.stripe_session_id}`)
        console.log(`      Stripe Subscription ID: ${plan.stripe_subscription_id}`)
      })
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message)
  }
}

debugPlanSubscriptionMismatch()
