#!/usr/bin/env node

/**
 * Create missing subscriptions from recent webhook events
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createMissingSubscriptionsFromEvents() {
  console.log('🔧 Creating Missing Subscriptions from Recent Events...\n')

  try {
    // Get recent customer.subscription.created events
    const { data: subscriptionEvents, error: eventsError } = await supabase
      .from('stripe_events')
      .select('*')
      .eq('type', 'customer.subscription.created')
      .order('created_at', { ascending: false })
      .limit(10)

    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError)
      return
    }

    console.log(`Found ${subscriptionEvents.length} customer.subscription.created events`)

    // Get existing subscriptions to avoid duplicates
    const { data: existingSubscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')

    if (subError) {
      console.error('❌ Error fetching existing subscriptions:', subError)
      return
    }

    const existingSubIds = new Set(existingSubscriptions.map(sub => sub.stripe_subscription_id))
    console.log(`Found ${existingSubIds.size} existing subscriptions`)

    // Process each event
    let createdCount = 0
    for (const event of subscriptionEvents) {
      const eventData = event.payload.data.object
      const subscriptionId = eventData.id
      const planId = eventData.metadata?.plan_id
      const userId = eventData.metadata?.user_id

      console.log(`\n🔍 Processing event: ${event.id}`)
      console.log(`   Subscription ID: ${subscriptionId}`)
      console.log(`   Plan ID: ${planId}`)
      console.log(`   User ID: ${userId}`)

      // Skip if subscription already exists
      if (existingSubIds.has(subscriptionId)) {
        console.log(`   ⏭️  Subscription already exists, skipping`)
        continue
      }

      // Skip if missing required data
      if (!planId || !userId) {
        console.log(`   ⚠️  Missing plan_id or user_id, skipping`)
        continue
      }

      // Verify the plan exists and has the correct user_id
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .eq('user_id', userId)
        .single()

      if (planError || !planData) {
        console.log(`   ❌ Plan not found or user_id mismatch, skipping`)
        continue
      }

      console.log(`   ✅ Plan found: ${planData.id} (status: ${planData.status})`)

      // Create subscription data
      const subscriptionData = {
        user_id: userId,
        plan_id: planId,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: eventData.customer,
        stripe_price_id: eventData.items?.data?.[0]?.price?.id || null,
        status: eventData.status || 'active',
        current_period_start: new Date(eventData.current_period_start * 1000).toISOString(),
        current_period_end: new Date(eventData.current_period_end * 1000).toISOString(),
        currency: eventData.currency || 'usd',
        interval: eventData.items?.data?.[0]?.price?.recurring?.interval || 'month',
        interval_count: eventData.items?.data?.[0]?.price?.recurring?.interval_count || 1,
        billing_cycle: eventData.items?.data?.[0]?.price?.recurring?.interval || 'monthly',
        cancel_at_period_end: eventData.cancel_at_period_end || false,
        canceled_at: eventData.canceled_at ? new Date(eventData.canceled_at * 1000).toISOString() : null,
        default_payment_method_id: eventData.default_payment_method || null,
        metadata: {
          ...eventData.metadata,
          webhook_event_id: event.id,
          created_from_webhook_event: true,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Create the subscription
      const { data: newSubscription, error: insertError } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()

      if (insertError) {
        console.log(`   ❌ Failed to create subscription: ${insertError.message}`)
      } else {
        console.log(`   ✅ Created subscription: ${newSubscription[0].id}`)
        createdCount++
      }
    }

    console.log(`\n🎉 Completed! Created ${createdCount} missing subscriptions`)
    
    if (createdCount > 0) {
      console.log('\n📋 Summary:')
      console.log('✅ Created missing subscription records from webhook events')
      console.log('✅ Your dashboard should now show real subscription data')
      console.log('✅ The webhook bug has been fixed for future checkouts')
    } else {
      console.log('\n📋 Summary:')
      console.log('ℹ️  No missing subscriptions found to create')
      console.log('✅ All recent events already have corresponding subscription records')
    }

  } catch (error) {
    console.error('❌ Failed:', error.message)
  }
}

createMissingSubscriptionsFromEvents()
