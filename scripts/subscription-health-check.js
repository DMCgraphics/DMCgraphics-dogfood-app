#!/usr/bin/env node

/**
 * Subscription Health Check Script
 * This script performs various health checks on the subscriptions table
 * to identify potential data integrity issues
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function subscriptionHealthCheck() {
  console.log('🏥 Starting Subscription Health Check...\n')

  try {
    // Check 1: Orphaned subscriptions (user_id doesn't exist in auth.users)
    console.log('1. Checking for orphaned subscriptions...')
    const { data: allSubscriptions, error: allSubsError } = await supabase
      .from('subscriptions')
      .select('id, user_id, stripe_subscription_id, status, created_at')

    if (allSubsError) {
      console.error('❌ Error fetching subscriptions:', allSubsError)
      return
    }

    const orphanedSubs = []
    for (const sub of allSubscriptions || []) {
      if (sub.user_id) {
        const { data: user, error: userError } = await supabase.auth.admin.getUserById(sub.user_id)
        if (userError || !user) {
          orphanedSubs.push(sub)
        }
      }
    }

    console.log(`   Total subscriptions: ${allSubscriptions?.length || 0}`)
    console.log(`   Orphaned subscriptions: ${orphanedSubs.length}`)
    if (orphanedSubs.length > 0) {
      console.log('   🚨 Issues found:')
      orphanedSubs.forEach(sub => {
        console.log(`      - ${sub.id} (user_id: ${sub.user_id})`)
      })
    } else {
      console.log('   ✅ No orphaned subscriptions found')
    }

    // Check 2: Subscriptions with NULL user_id
    console.log('\n2. Checking for subscriptions with NULL user_id...')
    const nullUserSubs = (allSubscriptions || []).filter(sub => !sub.user_id)
    console.log(`   NULL user_id subscriptions: ${nullUserSubs.length}`)
    if (nullUserSubs.length > 0) {
      console.log('   🚨 Issues found:')
      nullUserSubs.forEach(sub => {
        console.log(`      - ${sub.id} (stripe_id: ${sub.stripe_subscription_id})`)
      })
    } else {
      console.log('   ✅ No NULL user_id subscriptions found')
    }

    // Check 3: Subscriptions with NULL current_period_end
    console.log('\n3. Checking for subscriptions with NULL current_period_end...')
    const { data: nullPeriodSubs, error: nullPeriodError } = await supabase
      .from('subscriptions')
      .select('id, user_id, stripe_subscription_id, status, current_period_end')
      .is('current_period_end', null)

    if (nullPeriodError) {
      console.error('❌ Error fetching NULL period subscriptions:', nullPeriodError)
    } else {
      console.log(`   NULL current_period_end subscriptions: ${nullPeriodSubs?.length || 0}`)
      if (nullPeriodSubs && nullPeriodSubs.length > 0) {
        console.log('   🚨 Issues found:')
        nullPeriodSubs.forEach(sub => {
          console.log(`      - ${sub.id} (stripe_id: ${sub.stripe_subscription_id}, status: ${sub.status})`)
        })
      } else {
        console.log('   ✅ No NULL current_period_end subscriptions found')
      }
    }

    // Check 4: Duplicate stripe_subscription_ids
    console.log('\n4. Checking for duplicate stripe_subscription_ids...')
    const { data: duplicateSubs, error: duplicateError } = await supabase
      .rpc('find_duplicate_stripe_subscription_ids')

    if (duplicateError) {
      // If the RPC doesn't exist, we'll do a manual check
      const { data: allStripeIds, error: stripeIdsError } = await supabase
        .from('subscriptions')
        .select('stripe_subscription_id')
        .not('stripe_subscription_id', 'is', null)

      if (stripeIdsError) {
        console.error('❌ Error checking duplicate stripe IDs:', stripeIdsError)
      } else {
        const stripeIdCounts = {}
        allStripeIds?.forEach(sub => {
          stripeIdCounts[sub.stripe_subscription_id] = (stripeIdCounts[sub.stripe_subscription_id] || 0) + 1
        })
        
        const duplicates = Object.entries(stripeIdCounts).filter(([id, count]) => count > 1)
        console.log(`   Duplicate stripe_subscription_ids: ${duplicates.length}`)
        if (duplicates.length > 0) {
          console.log('   🚨 Issues found:')
          duplicates.forEach(([id, count]) => {
            console.log(`      - ${id} (appears ${count} times)`)
          })
        } else {
          console.log('   ✅ No duplicate stripe_subscription_ids found')
        }
      }
    } else {
      console.log(`   Duplicate stripe_subscription_ids: ${duplicateSubs?.length || 0}`)
      if (duplicateSubs && duplicateSubs.length > 0) {
        console.log('   🚨 Issues found:')
        duplicateSubs.forEach(dup => {
          console.log(`      - ${dup.stripe_subscription_id} (appears ${dup.count} times)`)
        })
      } else {
        console.log('   ✅ No duplicate stripe_subscription_ids found')
      }
    }

    // Check 5: Subscriptions without associated plans
    console.log('\n5. Checking for subscriptions without associated plans...')
    const { data: noPlanSubs, error: noPlanError } = await supabase
      .from('subscriptions')
      .select('id, user_id, stripe_subscription_id, plan_id')
      .is('plan_id', null)

    if (noPlanError) {
      console.error('❌ Error checking subscriptions without plans:', noPlanError)
    } else {
      console.log(`   Subscriptions without plans: ${noPlanSubs?.length || 0}`)
      if (noPlanSubs && noPlanSubs.length > 0) {
        console.log('   🚨 Issues found:')
        noPlanSubs.forEach(sub => {
          console.log(`      - ${sub.id} (stripe_id: ${sub.stripe_subscription_id})`)
        })
      } else {
        console.log('   ✅ All subscriptions have associated plans')
      }
    }

    // Check 6: Summary statistics
    console.log('\n6. Subscription Statistics:')
    const { data: stats, error: statsError } = await supabase
      .from('subscriptions')
      .select('status')

    if (statsError) {
      console.error('❌ Error fetching subscription stats:', statsError)
    } else {
      const statusCounts = {}
      stats?.forEach(sub => {
        statusCounts[sub.status] = (statusCounts[sub.status] || 0) + 1
      })
      
      console.log('   Status breakdown:')
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`      ${status}: ${count}`)
      })
    }

    // Final summary
    const totalIssues = orphanedSubs.length + nullUserSubs.length + (nullPeriodSubs?.length || 0)
    console.log('\n📊 Health Check Summary:')
    console.log('   ' + '='.repeat(40))
    console.log(`   Total subscriptions: ${allSubscriptions?.length || 0}`)
    console.log(`   Total issues found: ${totalIssues}`)
    
    if (totalIssues === 0) {
      console.log('   ✅ All subscriptions are healthy!')
    } else {
      console.log('   ⚠️  Some issues were found. Consider running cleanup scripts.')
    }

  } catch (error) {
    console.error('❌ Fatal error during health check:', error)
  }
}

// Run the health check
subscriptionHealthCheck().catch(console.error)
