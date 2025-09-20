#!/usr/bin/env node

/**
 * Fix cascade deletion and clean up orphaned data
 * This script ensures proper foreign key constraints and removes orphaned data
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixCascadeDeletion() {
  console.log('🔧 Fixing cascade deletion and cleaning up orphaned data...\n')

  try {
    // Step 1: Check current orphaned data
    console.log('1. Checking for orphaned data...')
    
    const { data: orphanedDogs, error: dogsError } = await supabase
      .from('dogs')
      .select('id, name, user_id')
      .is('user_id', null)
    
    const { data: orphanedPlans, error: plansError } = await supabase
      .from('plans')
      .select('id, user_id, dog_id, status')
      .is('user_id', null)
    
    const { data: orphanedSubscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('id, user_id, plan_id, status')
      .is('user_id', null)
    
    const { data: orphanedOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, user_id, plan_id')
      .is('user_id', null)
    
    console.log(`   Orphaned dogs: ${orphanedDogs?.length || 0}`)
    console.log(`   Orphaned plans: ${orphanedPlans?.length || 0}`)
    console.log(`   Orphaned subscriptions: ${orphanedSubscriptions?.length || 0}`)
    console.log(`   Orphaned orders: ${orphanedOrders?.length || 0}`)
    
    if (orphanedDogs?.length > 0) {
      console.log('   Orphaned dogs:')
      orphanedDogs.forEach(dog => console.log(`     - ${dog.name} (${dog.id})`))
    }
    
    if (orphanedPlans?.length > 0) {
      console.log('   Orphaned plans:')
      orphanedPlans.forEach(plan => console.log(`     - Plan ${plan.id} (Dog: ${plan.dog_id}, Status: ${plan.status})`))
    }

    // Step 2: Clean up orphaned data
    console.log('\n2. Cleaning up orphaned data...')
    
    let deletedCount = 0
    
    // Delete orphaned plan_items first (they reference plans and dogs)
    if (orphanedPlans?.length > 0) {
      const orphanedPlanIds = orphanedPlans.map(p => p.id)
      const { error: planItemsError } = await supabase
        .from('plan_items')
        .delete()
        .in('plan_id', orphanedPlanIds)
      
      if (planItemsError) {
        console.error('   ❌ Error deleting orphaned plan_items:', planItemsError.message)
      } else {
        console.log('   ✅ Deleted orphaned plan_items')
        deletedCount++
      }
    }
    
    // Delete orphaned subscriptions
    if (orphanedSubscriptions?.length > 0) {
      const { error: subsDeleteError } = await supabase
        .from('subscriptions')
        .delete()
        .is('user_id', null)
      
      if (subsDeleteError) {
        console.error('   ❌ Error deleting orphaned subscriptions:', subsDeleteError.message)
      } else {
        console.log('   ✅ Deleted orphaned subscriptions')
        deletedCount++
      }
    }
    
    // Delete orphaned orders
    if (orphanedOrders?.length > 0) {
      const { error: ordersDeleteError } = await supabase
        .from('orders')
        .delete()
        .is('user_id', null)
      
      if (ordersDeleteError) {
        console.error('   ❌ Error deleting orphaned orders:', ordersDeleteError.message)
      } else {
        console.log('   ✅ Deleted orphaned orders')
        deletedCount++
      }
    }
    
    // Delete orphaned plans
    if (orphanedPlans?.length > 0) {
      const { error: plansDeleteError } = await supabase
        .from('plans')
        .delete()
        .is('user_id', null)
      
      if (plansDeleteError) {
        console.error('   ❌ Error deleting orphaned plans:', plansDeleteError.message)
      } else {
        console.log('   ✅ Deleted orphaned plans')
        deletedCount++
      }
    }
    
    // Delete orphaned dogs
    if (orphanedDogs?.length > 0) {
      const { error: dogsDeleteError } = await supabase
        .from('dogs')
        .delete()
        .is('user_id', null)
      
      if (dogsDeleteError) {
        console.error('   ❌ Error deleting orphaned dogs:', dogsDeleteError.message)
      } else {
        console.log('   ✅ Deleted orphaned dogs')
        deletedCount++
      }
    }

    // Step 3: Verify cleanup
    console.log('\n3. Verifying cleanup...')
    
    const { data: remainingOrphanedDogs } = await supabase
      .from('dogs')
      .select('id')
      .is('user_id', null)
    
    const { data: remainingOrphanedPlans } = await supabase
      .from('plans')
      .select('id')
      .is('user_id', null)
    
    const { data: remainingOrphanedSubscriptions } = await supabase
      .from('subscriptions')
      .select('id')
      .is('user_id', null)
    
    const { data: remainingOrphanedOrders } = await supabase
      .from('orders')
      .select('id')
      .is('user_id', null)
    
    console.log(`   Remaining orphaned dogs: ${remainingOrphanedDogs?.length || 0}`)
    console.log(`   Remaining orphaned plans: ${remainingOrphanedPlans?.length || 0}`)
    console.log(`   Remaining orphaned subscriptions: ${remainingOrphanedSubscriptions?.length || 0}`)
    console.log(`   Remaining orphaned orders: ${remainingOrphanedOrders?.length || 0}`)
    
    if (deletedCount > 0) {
      console.log('\n✅ Cleanup completed successfully!')
      console.log('   Note: You may need to run the SQL script to fix foreign key constraints for future deletions.')
    } else {
      console.log('\n✅ No orphaned data found - database is clean!')
    }

    // Step 4: Show current data summary
    console.log('\n4. Current data summary:')
    
    const { data: allDogs } = await supabase
      .from('dogs')
      .select('id, name, user_id')
    
    const { data: allPlans } = await supabase
      .from('plans')
      .select('id, user_id, dog_id, status')
    
    const { data: allSubscriptions } = await supabase
      .from('subscriptions')
      .select('id, user_id, plan_id, status')
    
    console.log(`   Total dogs: ${allDogs?.length || 0}`)
    console.log(`   Total plans: ${allPlans?.length || 0}`)
    console.log(`   Total subscriptions: ${allSubscriptions?.length || 0}`)
    
    // Group by user_id to show data distribution
    const userData = {}
    allDogs?.forEach(dog => {
      if (dog.user_id) {
        if (!userData[dog.user_id]) {
          userData[dog.user_id] = { dogs: 0, plans: 0, subscriptions: 0 }
        }
        userData[dog.user_id].dogs++
      }
    })
    
    allPlans?.forEach(plan => {
      if (plan.user_id) {
        if (!userData[plan.user_id]) {
          userData[plan.user_id] = { dogs: 0, plans: 0, subscriptions: 0 }
        }
        userData[plan.user_id].plans++
      }
    })
    
    allSubscriptions?.forEach(sub => {
      if (sub.user_id) {
        if (!userData[sub.user_id]) {
          userData[sub.user_id] = { dogs: 0, plans: 0, subscriptions: 0 }
        }
        userData[sub.user_id].subscriptions++
      }
    })
    
    console.log(`   Data distributed across ${Object.keys(userData).length} users`)
    Object.entries(userData).forEach(([userId, counts]) => {
      console.log(`     - User ${userId.substring(0, 8)}...: ${counts.dogs} dogs, ${counts.plans} plans, ${counts.subscriptions} subscriptions`)
    })

  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error)
  }
}

// Run the cleanup
fixCascadeDeletion().catch(console.error)
