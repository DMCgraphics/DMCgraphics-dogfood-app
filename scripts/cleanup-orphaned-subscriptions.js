#!/usr/bin/env node

/**
 * Cleanup script to remove subscriptions that aren't associated with existing users
 * This script identifies and removes orphaned subscriptions from the database
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanupOrphanedSubscriptions() {
  console.log('🧹 Starting Orphaned Subscriptions Cleanup...\n')

  try {
    // Step 1: Identify orphaned subscriptions
    console.log('1. Identifying orphaned subscriptions...')
    
    const { data: orphanedSubscriptions, error: orphanedError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        stripe_subscription_id,
        status,
        created_at,
        plan_id
      `)
      .not('user_id', 'is', null) // Only get subscriptions with user_id set

    if (orphanedError) {
      console.error('❌ Error fetching subscriptions:', orphanedError)
      return
    }

    console.log(`   Found ${orphanedSubscriptions?.length || 0} total subscriptions`)

    // Step 2: Check which user_ids don't exist in auth.users
    console.log('2. Checking for orphaned subscriptions...')
    
    const orphanedSubs = []
    
    for (const subscription of orphanedSubscriptions || []) {
      // Check if the user exists in auth.users
      const { data: user, error: userError } = await supabase.auth.admin.getUserById(subscription.user_id)
      
      if (userError || !user) {
        console.log(`   🚨 Orphaned subscription found: ${subscription.id} (user_id: ${subscription.user_id})`)
        orphanedSubs.push(subscription)
      }
    }

    console.log(`   Found ${orphanedSubs.length} orphaned subscriptions`)

    if (orphanedSubs.length === 0) {
      console.log('✅ No orphaned subscriptions found!')
      return
    }

    // Step 3: Display orphaned subscriptions details
    console.log('\n3. Orphaned subscriptions details:')
    console.log('   ' + '='.repeat(80))
    orphanedSubs.forEach((sub, index) => {
      console.log(`   ${index + 1}. ID: ${sub.id}`)
      console.log(`      User ID: ${sub.user_id}`)
      console.log(`      Stripe ID: ${sub.stripe_subscription_id || 'N/A'}`)
      console.log(`      Status: ${sub.status}`)
      console.log(`      Plan ID: ${sub.plan_id || 'N/A'}`)
      console.log(`      Created: ${sub.created_at}`)
      console.log('   ' + '-'.repeat(40))
    })

    // Step 4: Confirm deletion
    console.log(`\n4. Ready to delete ${orphanedSubs.length} orphaned subscriptions`)
    console.log('   ⚠️  This action cannot be undone!')
    
    // In a real scenario, you might want to add a confirmation prompt here
    // For now, we'll proceed with deletion
    
    // Step 5: Delete orphaned subscriptions
    console.log('\n5. Deleting orphaned subscriptions...')
    
    let deletedCount = 0
    let errorCount = 0

    for (const subscription of orphanedSubs) {
      try {
        const { error: deleteError } = await supabase
          .from('subscriptions')
          .delete()
          .eq('id', subscription.id)

        if (deleteError) {
          console.error(`   ❌ Failed to delete subscription ${subscription.id}:`, deleteError.message)
          errorCount++
        } else {
          console.log(`   ✅ Deleted subscription ${subscription.id}`)
          deletedCount++
        }
      } catch (err) {
        console.error(`   ❌ Error deleting subscription ${subscription.id}:`, err.message)
        errorCount++
      }
    }

    // Step 6: Summary
    console.log('\n6. Cleanup Summary:')
    console.log('   ' + '='.repeat(40))
    console.log(`   Total orphaned subscriptions found: ${orphanedSubs.length}`)
    console.log(`   Successfully deleted: ${deletedCount}`)
    console.log(`   Failed to delete: ${errorCount}`)
    
    if (deletedCount > 0) {
      console.log('   ✅ Cleanup completed successfully!')
    } else {
      console.log('   ⚠️  No subscriptions were deleted')
    }

  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error)
  }
}

// Also check for subscriptions with NULL user_id
async function cleanupNullUserSubscriptions() {
  console.log('\n🔍 Checking for subscriptions with NULL user_id...')
  
  try {
    const { data: nullUserSubs, error: nullError } = await supabase
      .from('subscriptions')
      .select('id, stripe_subscription_id, status, created_at')
      .is('user_id', null)

    if (nullError) {
      console.error('❌ Error fetching NULL user subscriptions:', nullError)
      return
    }

    if (nullUserSubs && nullUserSubs.length > 0) {
      console.log(`   Found ${nullUserSubs.length} subscriptions with NULL user_id:`)
      
      nullUserSubs.forEach((sub, index) => {
        console.log(`   ${index + 1}. ID: ${sub.id}, Stripe ID: ${sub.stripe_subscription_id || 'N/A'}, Status: ${sub.status}`)
      })

      console.log('\n   Deleting NULL user subscriptions...')
      
      const { error: deleteError } = await supabase
        .from('subscriptions')
        .delete()
        .is('user_id', null)

      if (deleteError) {
        console.error('   ❌ Failed to delete NULL user subscriptions:', deleteError)
      } else {
        console.log(`   ✅ Deleted ${nullUserSubs.length} NULL user subscriptions`)
      }
    } else {
      console.log('   ✅ No subscriptions with NULL user_id found')
    }
  } catch (error) {
    console.error('❌ Error checking NULL user subscriptions:', error)
  }
}

// Run the cleanup
async function main() {
  await cleanupOrphanedSubscriptions()
  await cleanupNullUserSubscriptions()
  console.log('\n🎉 Cleanup process completed!')
}

main().catch(console.error)
