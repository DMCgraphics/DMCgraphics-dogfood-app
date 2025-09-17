#!/usr/bin/env node

/**
 * Debug the latest webhook events to see why subscriptions aren't being created
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugLatestWebhookEvents() {
  console.log('🔍 Debugging Latest Webhook Events...\n')

  try {
    // Get the most recent webhook events
    const { data: recentEvents, error: eventsError } = await supabase
      .from('stripe_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError)
      return
    }

    console.log(`📋 Recent Webhook Events (${recentEvents.length} total):`)
    recentEvents.forEach((event, index) => {
      const eventTime = new Date(event.created_at)
      const timeAgo = Math.round((Date.now() - eventTime.getTime()) / (1000 * 60)) // minutes ago
      console.log(`   ${index + 1}. ${event.type} - ${timeAgo} minutes ago`)
      console.log(`      Event ID: ${event.id}`)
      
      if (event.payload?.data?.object?.id) {
        console.log(`      Object ID: ${event.payload.data.object.id}`)
      }
      if (event.payload?.data?.object?.metadata?.plan_id) {
        console.log(`      Plan ID: ${event.payload.data.object.metadata.plan_id}`)
      }
      if (event.payload?.data?.object?.metadata?.user_id) {
        console.log(`      User ID: ${event.payload.data.object.metadata.user_id}`)
      }
      if (event.payload?.data?.object?.subscription) {
        console.log(`      Subscription ID: ${event.payload.data.object.subscription}`)
      }
      if (event.payload?.data?.object?.customer) {
        console.log(`      Customer ID: ${event.payload.data.object.customer}`)
      }
    })

    // Get the most recent plan
    const { data: recentPlan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('status', 'active')
      .not('stripe_subscription_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (planError) {
      console.error('❌ Error fetching recent plan:', planError)
      return
    }

    console.log(`\n📋 Most Recent Plan:`)
    console.log(`   Plan ID: ${recentPlan.id}`)
    console.log(`   User ID: ${recentPlan.user_id}`)
    console.log(`   Status: ${recentPlan.status}`)
    console.log(`   Stripe Session ID: ${recentPlan.stripe_session_id}`)
    console.log(`   Stripe Subscription ID: ${recentPlan.stripe_subscription_id}`)
    console.log(`   Updated: ${recentPlan.updated_at}`)

    // Check if subscription exists for this plan
    const { data: existingSub, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', recentPlan.stripe_subscription_id)
      .single()

    if (subError) {
      console.log(`\n❌ No subscription found for Stripe Subscription ID: ${recentPlan.stripe_subscription_id}`)
      console.log(`   Error: ${subError.message}`)
      
      // Find the corresponding webhook event
      const correspondingEvent = recentEvents.find(event => 
        event.payload?.data?.object?.subscription === recentPlan.stripe_subscription_id
      )
      
      if (correspondingEvent) {
        console.log(`\n🔍 Found corresponding webhook event:`)
        console.log(`   Event Type: ${correspondingEvent.type}`)
        console.log(`   Event ID: ${correspondingEvent.id}`)
        console.log(`   Created: ${correspondingEvent.created_at}`)
        console.log(`   Plan ID: ${correspondingEvent.payload?.data?.object?.metadata?.plan_id}`)
        console.log(`   User ID: ${correspondingEvent.payload?.data?.object?.metadata?.user_id}`)
        
        // Try to simulate the webhook logic
        console.log(`\n🧪 Simulating webhook subscription creation...`)
        
        const eventData = correspondingEvent.payload.data.object
        const subscriptionData = {
          user_id: eventData.metadata?.user_id || recentPlan.user_id,
          plan_id: eventData.metadata?.plan_id || recentPlan.id,
          stripe_subscription_id: eventData.id,
          stripe_customer_id: eventData.customer,
          stripe_price_id: eventData.items?.data?.[0]?.price?.id || 'price_unknown',
          status: eventData.status || 'active',
          current_period_start: new Date(eventData.current_period_start * 1000).toISOString(),
          current_period_end: new Date(eventData.current_period_end * 1000).toISOString(),
          currency: eventData.currency || 'usd',
          interval: eventData.items?.data?.[0]?.price?.recurring?.interval || 'month',
          interval_count: eventData.items?.data?.[0]?.price?.recurring?.interval_count || 1,
          billing_cycle: eventData.items?.data?.[0]?.price?.recurring?.interval || 'monthly',
          cancel_at_period_end: eventData.cancel_at_period_end || false,
          canceled_at: eventData.canceled_at ? new Date(eventData.canceled_at * 1000).toISOString() : null,
          default_payment_method_id: eventData.default_payment_method,
          metadata: {
            checkout_session_id: recentPlan.stripe_session_id,
            stripe_customer_id: eventData.customer,
            plan_id: eventData.metadata?.plan_id || recentPlan.id,
            webhook_event_id: correspondingEvent.id,
            created_from_webhook: true,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        console.log(`\n📋 Subscription data to create:`)
        console.log(`   User ID: ${subscriptionData.user_id}`)
        console.log(`   Plan ID: ${subscriptionData.plan_id}`)
        console.log(`   Stripe Subscription ID: ${subscriptionData.stripe_subscription_id}`)
        console.log(`   Stripe Customer ID: ${subscriptionData.stripe_customer_id}`)
        console.log(`   Status: ${subscriptionData.status}`)
        console.log(`   Current Period Start: ${subscriptionData.current_period_start}`)
        console.log(`   Current Period End: ${subscriptionData.current_period_end}`)

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
        }
      } else {
        console.log(`\n❌ No corresponding webhook event found for subscription ID: ${recentPlan.stripe_subscription_id}`)
      }
    } else {
      console.log(`\n✅ Subscription found: ${existingSub.id}`)
      console.log(`   Created: ${existingSub.created_at}`)
    }

    // Check all subscriptions
    const { data: allSubscriptions, error: allSubError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (allSubError) {
      console.error('❌ Error fetching all subscriptions:', allSubError)
    } else {
      console.log(`\n📋 All Subscriptions (${allSubscriptions.length} total):`)
      allSubscriptions.forEach((sub, index) => {
        const createdTime = new Date(sub.created_at)
        const timeAgo = Math.round((Date.now() - createdTime.getTime()) / (1000 * 60)) // minutes ago
        console.log(`   ${index + 1}. ${sub.id} - ${timeAgo} minutes ago`)
        console.log(`      Stripe Subscription ID: ${sub.stripe_subscription_id}`)
        console.log(`      User ID: ${sub.user_id}`)
        console.log(`      Plan ID: ${sub.plan_id}`)
        console.log(`      Status: ${sub.status}`)
      })
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message)
  }
}

debugLatestWebhookEvents()
