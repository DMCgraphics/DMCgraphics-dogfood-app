#!/usr/bin/env node

/**
 * Fix script to update subscriptions with NULL current_period_end
 * This script fetches the latest data from Stripe and updates the subscription
 */

const { createClient } = require('@supabase/supabase-js')
const Stripe = require('stripe')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'
process.env.STRIPE_SECRET_KEY = 'sk_test_51S8z8R0R4BbWwBbfpWwmiV3o'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' })

async function fixNullPeriodEnd() {
  console.log('🔧 Fixing subscriptions with NULL current_period_end...\n')

  try {
    // Step 1: Find subscriptions with NULL current_period_end
    console.log('1. Finding subscriptions with NULL current_period_end...')
    
    const { data: nullPeriodSubs, error: nullPeriodError } = await supabase
      .from('subscriptions')
      .select('id, user_id, stripe_subscription_id, status, current_period_start, current_period_end')
      .is('current_period_end', null)

    if (nullPeriodError) {
      console.error('❌ Error fetching NULL period subscriptions:', nullPeriodError)
      return
    }

    if (!nullPeriodSubs || nullPeriodSubs.length === 0) {
      console.log('✅ No subscriptions with NULL current_period_end found!')
      return
    }

    console.log(`   Found ${nullPeriodSubs.length} subscriptions with NULL current_period_end`)

    // Step 2: Update each subscription with data from Stripe
    console.log('\n2. Updating subscriptions with Stripe data...')
    
    let updatedCount = 0
    let errorCount = 0

    for (const subscription of nullPeriodSubs) {
      try {
        console.log(`   Processing subscription: ${subscription.id}`)
        console.log(`   Stripe ID: ${subscription.stripe_subscription_id}`)

        if (!subscription.stripe_subscription_id) {
          console.log(`   ⚠️  No Stripe subscription ID, skipping...`)
          continue
        }

        // Fetch subscription data from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)
        
        console.log(`   Stripe status: ${stripeSubscription.status}`)
        console.log(`   Current period start: ${new Date(stripeSubscription.current_period_start * 1000).toISOString()}`)
        console.log(`   Current period end: ${new Date(stripeSubscription.current_period_end * 1000).toISOString()}`)

        // Update the subscription with Stripe data
        const updateData = {
          status: stripeSubscription.status,
          current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          currency: stripeSubscription.currency,
          interval: stripeSubscription.items.data[0]?.price.recurring?.interval || 'month',
          interval_count: stripeSubscription.items.data[0]?.price.recurring?.interval_count || 1,
          cancel_at_period_end: stripeSubscription.cancel_at_period_end || false,
          canceled_at: stripeSubscription.canceled_at
            ? new Date(stripeSubscription.canceled_at * 1000).toISOString()
            : null,
          default_payment_method_id: typeof stripeSubscription.default_payment_method === 'string' 
            ? stripeSubscription.default_payment_method 
            : stripeSubscription.default_payment_method?.id || null,
          updated_at: new Date().toISOString(),
        }

        const { error: updateError } = await supabase
          .from('subscriptions')
          .update(updateData)
          .eq('id', subscription.id)

        if (updateError) {
          console.error(`   ❌ Failed to update subscription ${subscription.id}:`, updateError.message)
          errorCount++
        } else {
          console.log(`   ✅ Successfully updated subscription ${subscription.id}`)
          updatedCount++
        }

      } catch (stripeError) {
        console.error(`   ❌ Error fetching Stripe data for ${subscription.stripe_subscription_id}:`, stripeError.message)
        errorCount++
      }

      console.log('   ' + '-'.repeat(40))
    }

    // Step 3: Summary
    console.log('\n3. Fix Summary:')
    console.log('   ' + '='.repeat(40))
    console.log(`   Subscriptions processed: ${nullPeriodSubs.length}`)
    console.log(`   Successfully updated: ${updatedCount}`)
    console.log(`   Failed to update: ${errorCount}`)
    
    if (updatedCount > 0) {
      console.log('   ✅ Fix completed successfully!')
    } else {
      console.log('   ⚠️  No subscriptions were updated')
    }

    // Step 4: Verify the fix
    console.log('\n4. Verifying fix...')
    const { data: remainingNullSubs, error: verifyError } = await supabase
      .from('subscriptions')
      .select('id, stripe_subscription_id')
      .is('current_period_end', null)

    if (verifyError) {
      console.error('❌ Error verifying fix:', verifyError)
    } else {
      console.log(`   Remaining NULL current_period_end subscriptions: ${remainingNullSubs?.length || 0}`)
      if (remainingNullSubs && remainingNullSubs.length === 0) {
        console.log('   ✅ All subscriptions now have current_period_end values!')
      } else {
        console.log('   ⚠️  Some subscriptions still have NULL current_period_end')
      }
    }

  } catch (error) {
    console.error('❌ Fatal error during fix:', error)
  }
}

// Run the fix
fixNullPeriodEnd().catch(console.error)
