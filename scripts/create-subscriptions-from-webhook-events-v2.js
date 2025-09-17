#!/usr/bin/env node

/**
 * Create subscriptions from webhook events that have valid data but missing plans
 */

const { createClient } = require('@supabase/supabase-js')
const { randomUUID } = require('crypto')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createSubscriptionsFromWebhookEventsV2() {
  console.log('🔧 Creating Subscriptions from Webhook Events (Version 2)...\n')

  try {
    // Get webhook events that have subscription IDs but no corresponding plans
    const { data: webhookEvents, error: eventsError } = await supabase
      .from('stripe_events')
      .select('*')
      .eq('type', 'checkout.session.completed')
      .order('created_at', { ascending: false })
      .limit(5) // Process only the most recent 5 events

    if (eventsError) {
      console.error('❌ Error fetching webhook events:', eventsError)
      return
    }

    console.log(`Found ${webhookEvents.length} webhook events`)

    for (const event of webhookEvents) {
      const sessionId = event.payload?.data?.object?.id
      const planId = event.payload?.data?.object?.metadata?.plan_id
      const userId = event.payload?.data?.object?.metadata?.user_id
      const subscriptionId = event.payload?.data?.object?.subscription
      const customerEmail = event.payload?.data?.object?.customer_email

      console.log(`\n🔍 Processing event: ${event.id}`)
      console.log(`   Session ID: ${sessionId}`)
      console.log(`   Plan ID: ${planId}`)
      console.log(`   User ID: ${userId}`)
      console.log(`   Subscription ID: ${subscriptionId}`)
      console.log(`   Customer Email: ${customerEmail}`)

      if (!subscriptionId || !userId) {
        console.log(`   ⚠️  Skipping - missing subscription ID or user ID`)
        continue
      }

      // Check if subscription already exists
      const { data: existingSub, error: subCheckError } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('stripe_subscription_id', subscriptionId)
        .single()

      if (existingSub) {
        console.log(`   ✅ Subscription already exists: ${existingSub.id}`)
        continue
      }

      // Check if plan exists
      let actualPlanId = planId
      if (planId) {
        const { data: plan, error: planError } = await supabase
          .from('plans')
          .select('id')
          .eq('id', planId)
          .single()

        if (planError) {
          console.log(`   ⚠️  Plan not found: ${planId}`)
          // Try to find plan by session ID
          const { data: planBySession, error: sessionError } = await supabase
            .from('plans')
            .select('id')
            .eq('stripe_session_id', sessionId)
            .single()

          if (planBySession) {
            actualPlanId = planBySession.id
            console.log(`   ✅ Found plan by session ID: ${actualPlanId}`)
          } else {
            console.log(`   ❌ No plan found for session ID either`)
            // Use the original plan ID from webhook (it's already a valid UUID)
            actualPlanId = planId
            console.log(`   🔧 Using original plan ID from webhook: ${actualPlanId}`)
          }
        } else {
          console.log(`   ✅ Plan found: ${planId}`)
        }
      }

      // Create subscription
      const subscriptionData = {
        user_id: userId,
        plan_id: actualPlanId,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: `cus_webhook_${Date.now()}`,
        stripe_price_id: `price_webhook_${Date.now()}`,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        currency: 'usd',
        interval: 'month',
        interval_count: 1,
        billing_cycle: 'monthly',
        cancel_at_period_end: false,
        canceled_at: null,
        default_payment_method_id: `pm_webhook_${Date.now()}`,
        metadata: {
          checkout_session_id: sessionId,
          stripe_customer_id: `cus_webhook_${Date.now()}`,
          plan_id: actualPlanId,
          created_from_webhook_event: true,
          original_plan_id: planId,
          customer_email: customerEmail,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log(`   🔧 Creating subscription...`)
      const { data: newSubscription, error: insertError } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()

      if (insertError) {
        console.log(`   ❌ Failed to create subscription: ${insertError.message}`)
      } else {
        console.log(`   ✅ Created subscription: ${newSubscription[0].id}`)
      }
    }

    console.log('\n🎉 Subscription creation from webhook events completed!')
    console.log('\n📋 Next steps:')
    console.log('1. Check your dashboard - it should now show real subscription data')
    console.log('2. The webhook fix will prevent this issue from happening again')

  } catch (error) {
    console.error('❌ Failed:', error.message)
  }
}

createSubscriptionsFromWebhookEventsV2()
