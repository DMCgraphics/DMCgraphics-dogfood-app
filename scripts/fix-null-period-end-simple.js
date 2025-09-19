#!/usr/bin/env node

/**
 * Simple fix script to update subscriptions with NULL current_period_end
 * This script sets a reasonable current_period_end based on current_period_start
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixNullPeriodEndSimple() {
  console.log('🔧 Fixing subscriptions with NULL current_period_end (Simple approach)...\n')

  try {
    // Step 1: Find subscriptions with NULL current_period_end
    console.log('1. Finding subscriptions with NULL current_period_end...')
    
    const { data: nullPeriodSubs, error: nullPeriodError } = await supabase
      .from('subscriptions')
      .select('id, user_id, stripe_subscription_id, status, current_period_start, current_period_end, interval, created_at')
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

    // Step 2: Update each subscription
    console.log('\n2. Updating subscriptions...')
    
    let updatedCount = 0
    let errorCount = 0

    for (const subscription of nullPeriodSubs) {
      try {
        console.log(`   Processing subscription: ${subscription.id}`)
        console.log(`   Stripe ID: ${subscription.stripe_subscription_id}`)
        console.log(`   Status: ${subscription.status}`)
        console.log(`   Current period start: ${subscription.current_period_start}`)
        console.log(`   Interval: ${subscription.interval || 'month'}`)

        // Calculate current_period_end based on current_period_start and interval
        let periodEnd
        const interval = subscription.interval || 'month'
        const periodStart = subscription.current_period_start ? new Date(subscription.current_period_start) : new Date(subscription.created_at)

        if (interval === 'month') {
          periodEnd = new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
        } else if (interval === 'week') {
          periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
        } else if (interval === 'year') {
          periodEnd = new Date(periodStart.getTime() + 365 * 24 * 60 * 60 * 1000) // 365 days
        } else {
          periodEnd = new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000) // Default to 30 days
        }

        console.log(`   Calculated period end: ${periodEnd.toISOString()}`)

        // Update the subscription
        const updateData = {
          current_period_end: periodEnd.toISOString(),
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

      } catch (error) {
        console.error(`   ❌ Error processing subscription ${subscription.id}:`, error.message)
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
fixNullPeriodEndSimple().catch(console.error)
