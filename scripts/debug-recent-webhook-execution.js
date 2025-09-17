#!/usr/bin/env node

/**
 * Debug the most recent webhook execution to see why subscriptions aren't being created
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugRecentWebhookExecution() {
  console.log('🔍 Debugging Recent Webhook Execution...\n')

  try {
    // Get the most recent customer.subscription.created events
    const { data: recentSubEvents, error: eventsError } = await supabase
      .from('stripe_events')
      .select('*')
      .eq('type', 'customer.subscription.created')
      .order('created_at', { ascending: false })
      .limit(3)

    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError)
      return
    }

    console.log(`📋 Recent customer.subscription.created Events:`)
    recentSubEvents.forEach((event, index) => {
      const eventTime = new Date(event.created_at)
      const timeAgo = Math.round((Date.now() - eventTime.getTime()) / (1000 * 60)) // minutes ago
      
      console.log(`\n${index + 1}. Event: ${event.id} - ${timeAgo} minutes ago`)
      const eventData = event.payload.data.object
      console.log(`   Subscription ID: ${eventData.id}`)
      console.log(`   Plan ID: ${eventData.metadata?.plan_id}`)
      console.log(`   User ID: ${eventData.metadata?.user_id}`)
      console.log(`   Status: ${eventData.status}`)
      console.log(`   Current Period Start: ${eventData.current_period_start}`)
      console.log(`   Current Period End: ${eventData.current_period_end}`)
      console.log(`   Customer ID: ${eventData.customer}`)
      
      // Check if subscription exists
      console.log(`\n   🔍 Checking if subscription exists in database...`)
    })

    // Check each recent event for subscription creation
    for (const event of recentSubEvents) {
      const eventData = event.payload.data.object
      const subscriptionId = eventData.id
      const planId = eventData.metadata?.plan_id
      const userId = eventData.metadata?.user_id

      console.log(`\n🔍 Processing Event: ${event.id}`)
      console.log(`   Subscription ID: ${subscriptionId}`)
      console.log(`   Plan ID: ${planId}`)
      console.log(`   User ID: ${userId}`)

      // Check if subscription exists
      const { data: existingSub, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('stripe_subscription_id', subscriptionId)
        .single()

      if (subError) {
        console.log(`   ❌ No subscription found in database`)
        console.log(`   Error: ${subError.message}`)
        
        // Check if plan exists
        if (planId) {
          const { data: planData, error: planError } = await supabase
            .from('plans')
            .select('*')
            .eq('id', planId)
            .single()

          if (planError) {
            console.log(`   ❌ Plan not found: ${planError.message}`)
          } else {
            console.log(`   ✅ Plan found:`)
            console.log(`      ID: ${planData.id}`)
            console.log(`      User ID: ${planData.user_id}`)
            console.log(`      Status: ${planData.status}`)
            console.log(`      Stripe Subscription ID: ${planData.stripe_subscription_id}`)
            
            // Check if user_id matches
            if (planData.user_id !== userId) {
              console.log(`   ⚠️  User ID mismatch:`)
              console.log(`      Plan user_id: ${planData.user_id}`)
              console.log(`      Event user_id: ${userId}`)
            } else {
              console.log(`   ✅ User ID matches: ${userId}`)
            }
          }
        } else {
          console.log(`   ❌ No plan_id in event metadata`)
        }

        // Try to manually create the subscription to see what error we get
        console.log(`\n   🧪 Attempting manual subscription creation...`)
        
        const subscriptionData = {
          user_id: userId || 'test-user-id',
          plan_id: planId || 'test-plan-id',
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: eventData.customer,
          stripe_price_id: eventData.items?.data?.[0]?.price?.id || 'price_test',
          status: eventData.status || 'active',
          current_period_start: eventData.current_period_start ? new Date(eventData.current_period_start * 1000).toISOString() : new Date().toISOString(),
          current_period_end: eventData.current_period_end ? new Date(eventData.current_period_end * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
            created_manually: true,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { data: newSub, error: insertError } = await supabase
          .from('subscriptions')
          .insert(subscriptionData)
          .select()

        if (insertError) {
          console.log(`   ❌ Manual creation failed: ${insertError.message}`)
          console.log(`   This reveals the exact error preventing subscription creation!`)
        } else {
          console.log(`   ✅ Manual creation succeeded: ${newSub[0].id}`)
          console.log(`   This confirms the webhook code has a bug!`)
          
          // Clean up the test subscription
          await supabase
            .from('subscriptions')
            .delete()
            .eq('id', newSub[0].id)
          console.log(`   🧹 Test subscription cleaned up`)
        }
      } else {
        console.log(`   ✅ Subscription found in database: ${existingSub.id}`)
        console.log(`   Created: ${existingSub.created_at}`)
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message)
  }
}

debugRecentWebhookExecution()
