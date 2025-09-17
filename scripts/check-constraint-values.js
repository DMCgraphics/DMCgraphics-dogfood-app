#!/usr/bin/env node

/**
 * Check what billing_cycle values are actually being passed
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkConstraintValues() {
  console.log('🔍 Checking what billing_cycle values are being passed...\n')

  try {
    // Get the most recent customer.subscription.created event
    const { data: recentEvent, error: eventsError } = await supabase
      .from('stripe_events')
      .select('*')
      .eq('type', 'customer.subscription.created')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (eventsError) {
      console.error('❌ Error fetching event:', eventsError)
      return
    }

    const eventData = recentEvent.payload.data.object
    console.log('📋 Recent Event Data:')
    console.log(`   Subscription ID: ${eventData.id}`)
    console.log(`   Status: ${eventData.status}`)
    console.log(`   Current Period Start: ${eventData.current_period_start}`)
    console.log(`   Current Period End: ${eventData.current_period_end}`)
    
    // Check the items data
    if (eventData.items && eventData.items.data && eventData.items.data[0]) {
      const item = eventData.items.data[0]
      console.log(`\n📋 Price Data:`)
      console.log(`   Price ID: ${item.price?.id}`)
      console.log(`   Recurring Interval: ${item.price?.recurring?.interval}`)
      console.log(`   Recurring Interval Count: ${item.price?.recurring?.interval_count}`)
      
      // This is what the webhook code is trying to use
      const billingCycle = item.price?.recurring?.interval || 'monthly'
      console.log(`\n🔍 Billing Cycle Value: "${billingCycle}"`)
      
      // Check if this is a valid value
      const validValues = ['weekly', 'monthly', 'quarterly', 'yearly', 'day']
      if (validValues.includes(billingCycle)) {
        console.log(`   ✅ Valid billing_cycle value`)
      } else {
        console.log(`   ❌ Invalid billing_cycle value - not in allowed list: ${validValues.join(', ')}`)
      }
    } else {
      console.log(`   ❌ No items data found in event`)
    }

    // The issue might be that we're getting 'month' instead of 'monthly'
    console.log(`\n🔍 The Problem:`)
    console.log(`   Stripe sends 'month' for monthly subscriptions`)
    console.log(`   But our constraint expects 'monthly'`)
    console.log(`   We need to map 'month' -> 'monthly'`)

  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

checkConstraintValues()
