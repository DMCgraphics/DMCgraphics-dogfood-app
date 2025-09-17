#!/usr/bin/env node

/**
 * Debug why webhook events are not creating subscriptions
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugWebhookSubscriptionCreation() {
  console.log('🔍 Debugging Webhook Subscription Creation...\n')

  try {
    // Get the most recent webhook events
    const { data: recentEvents, error: eventsError } = await supabase
      .from('stripe_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError)
      return
    }

    console.log(`📋 Recent Webhook Events:`)
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
      console.log(`\n🔧 This means the webhook failed to create the subscription!`)
      
      // Try to create the subscription manually to see what error we get
      console.log(`\n🧪 Testing subscription creation manually...`)
      
      const subscriptionData = {
        user_id: recentPlan.user_id,
        plan_id: recentPlan.id,
        stripe_subscription_id: recentPlan.stripe_subscription_id,
        stripe_customer_id: 'cus_test_' + Date.now(),
        stripe_price_id: 'price_test_' + Date.now(),
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        currency: 'usd',
        interval: 'month',
        interval_count: 1,
        billing_cycle: 'monthly',
        cancel_at_period_end: false,
        canceled_at: null,
        default_payment_method_id: 'pm_test_' + Date.now(),
        metadata: {
          checkout_session_id: recentPlan.stripe_session_id,
          stripe_customer_id: 'cus_test_' + Date.now(),
          plan_id: recentPlan.id,
          created_manually: true,
          reason: 'webhook_debugging',
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
        console.log(`   This means the webhook code has a bug!`)
      }
    } else {
      console.log(`\n✅ Subscription found: ${existingSub.id}`)
      console.log(`   Created: ${existingSub.created_at}`)
    }

    // Check for any recent webhook events that should have created subscriptions
    console.log(`\n🔍 Checking for events that should have created subscriptions...`)
    
    const checkoutEvents = recentEvents.filter(event => event.type === 'checkout.session.completed')
    const subscriptionEvents = recentEvents.filter(event => event.type === 'customer.subscription.created')
    
    console.log(`   Checkout events: ${checkoutEvents.length}`)
    console.log(`   Subscription events: ${subscriptionEvents.length}`)
    
    if (checkoutEvents.length > 0) {
      console.log(`\n📋 Checkout Events Analysis:`)
      checkoutEvents.forEach((event, index) => {
        const sessionId = event.payload?.data?.object?.id
        const planId = event.payload?.data?.object?.metadata?.plan_id
        const userId = event.payload?.data?.object?.metadata?.user_id
        const subscriptionId = event.payload?.data?.object?.subscription
        
        console.log(`   ${index + 1}. Session: ${sessionId}`)
        console.log(`      Plan ID: ${planId}`)
        console.log(`      User ID: ${userId}`)
        console.log(`      Subscription ID: ${subscriptionId}`)
        
        if (!subscriptionId) {
          console.log(`      ⚠️  No subscription ID - webhook should wait for customer.subscription.created`)
        } else {
          console.log(`      ✅ Has subscription ID - webhook should create subscription`)
        }
      })
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message)
  }
}

debugWebhookSubscriptionCreation()
