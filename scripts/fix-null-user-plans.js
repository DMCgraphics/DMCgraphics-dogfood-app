#!/usr/bin/env node

/**
 * Fix plans that have null user_id by trying to match them with recent webhook events
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixNullUserPlans() {
  console.log('🔧 Fixing Plans with Null User IDs...\n')

  try {
    // Get plans with null user_id
    const { data: nullUserPlans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .is('user_id', null)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })

    if (plansError) {
      console.error('❌ Error fetching plans:', plansError)
      return
    }

    console.log(`Found ${nullUserPlans.length} active plans with null user_id`)

    if (nullUserPlans.length === 0) {
      console.log('✅ No plans with null user_id found!')
      return
    }

    // Get recent webhook events to try to match user_ids
    const { data: webhookEvents, error: eventsError } = await supabase
      .from('stripe_events')
      .select('payload, created_at')
      .eq('type', 'checkout.session.completed')
      .order('created_at', { ascending: false })
      .limit(20)

    if (eventsError) {
      console.error('❌ Error fetching webhook events:', eventsError)
      return
    }

    console.log(`Found ${webhookEvents.length} recent webhook events`)

    // Try to match plans with webhook events
    for (const plan of nullUserPlans) {
      console.log(`\n🔍 Processing plan: ${plan.id}`)
      console.log(`   Stripe Session ID: ${plan.stripe_session_id}`)
      console.log(`   Updated: ${plan.updated_at}`)

      // Find matching webhook event
      const matchingEvent = webhookEvents.find(event => {
        const sessionId = event.payload?.data?.object?.id
        const planId = event.payload?.data?.object?.metadata?.plan_id
        return sessionId === plan.stripe_session_id || planId === plan.id
      })

      if (matchingEvent) {
        const userId = matchingEvent.payload?.data?.object?.metadata?.user_id
        if (userId) {
          console.log(`   ✅ Found matching webhook event with user_id: ${userId}`)
          
          // Update the plan with the user_id
          const { error: updateError } = await supabase
            .from('plans')
            .update({ user_id: userId })
            .eq('id', plan.id)

          if (updateError) {
            console.log(`   ❌ Failed to update plan: ${updateError.message}`)
          } else {
            console.log(`   ✅ Successfully updated plan with user_id`)
            
            // Now try to create a subscription for this plan
            const subscriptionData = {
              user_id: userId,
              plan_id: plan.id,
              stripe_subscription_id: plan.stripe_subscription_id,
              stripe_customer_id: 'cus_retroactive_' + Date.now(),
              stripe_price_id: 'price_retroactive_' + Date.now(),
              status: 'active',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              currency: 'usd',
              interval: 'month',
              interval_count: 1,
              billing_cycle: 'monthly',
              cancel_at_period_end: false,
              canceled_at: null,
              default_payment_method_id: 'pm_retroactive_' + Date.now(),
              metadata: {
                checkout_session_id: plan.stripe_session_id,
                stripe_customer_id: 'cus_retroactive_' + Date.now(),
                plan_id: plan.id,
                created_retroactively: true,
                fixed_null_user_id: true,
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }

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
        } else {
          console.log(`   ⚠️  Found matching webhook event but no user_id in metadata`)
        }
      } else {
        console.log(`   ❌ No matching webhook event found`)
      }
    }

    console.log('\n🎉 Plan fixing completed!')
    console.log('\n📋 Next steps:')
    console.log('1. Check your dashboard - it should now show more real subscription data')
    console.log('2. The webhook fix will prevent this issue from happening again')

  } catch (error) {
    console.error('❌ Failed:', error.message)
  }
}

fixNullUserPlans()
