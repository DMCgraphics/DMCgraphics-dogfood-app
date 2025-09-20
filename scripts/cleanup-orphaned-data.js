#!/usr/bin/env node

/**
 * Cleanup script to remove orphaned data before applying CASCADE DELETE constraints
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanupOrphanedData() {
  console.log('🧹 Cleaning up orphaned data...\n')

  try {
    // Step 1: Get all valid user IDs
    console.log('1. Getting valid user IDs...')
    const { data: users } = await supabase.auth.admin.listUsers()
    const validUserIds = users.users.map(user => user.id)
    console.log(`   Found ${validUserIds.length} valid users`)

    // Step 2: Find orphaned data
    console.log('\n2. Finding orphaned data...')
    
    // Check for orphaned dogs
    const { data: allDogs } = await supabase
      .from('dogs')
      .select('id, name, user_id')
    
    const orphanedDogs = allDogs?.filter(dog => 
      !dog.user_id || !validUserIds.includes(dog.user_id)
    ) || []
    
    console.log(`   Orphaned dogs: ${orphanedDogs.length}`)
    if (orphanedDogs.length > 0) {
      orphanedDogs.forEach(dog => {
        console.log(`     - ${dog.name} (user_id: ${dog.user_id || 'NULL'})`)
      })
    }

    // Check for orphaned plans
    const { data: allPlans } = await supabase
      .from('plans')
      .select('id, user_id')
    
    const orphanedPlans = allPlans?.filter(plan => 
      !plan.user_id || !validUserIds.includes(plan.user_id)
    ) || []
    
    console.log(`   Orphaned plans: ${orphanedPlans.length}`)
    if (orphanedPlans.length > 0) {
      orphanedPlans.forEach(plan => {
        console.log(`     - Plan ${plan.id} (user_id: ${plan.user_id || 'NULL'})`)
      })
    }

    // Check for orphaned subscriptions
    const { data: allSubscriptions } = await supabase
      .from('subscriptions')
      .select('id, user_id, stripe_subscription_id')
    
    const orphanedSubscriptions = allSubscriptions?.filter(sub => 
      !sub.user_id || !validUserIds.includes(sub.user_id)
    ) || []
    
    console.log(`   Orphaned subscriptions: ${orphanedSubscriptions.length}`)
    if (orphanedSubscriptions.length > 0) {
      orphanedSubscriptions.forEach(sub => {
        console.log(`     - ${sub.stripe_subscription_id} (user_id: ${sub.user_id || 'NULL'})`)
      })
    }

    // Check for orphaned orders
    const { data: allOrders } = await supabase
      .from('orders')
      .select('id, user_id, order_number')
    
    const orphanedOrders = allOrders?.filter(order => 
      !order.user_id || !validUserIds.includes(order.user_id)
    ) || []
    
    console.log(`   Orphaned orders: ${orphanedOrders.length}`)
    if (orphanedOrders.length > 0) {
      orphanedOrders.forEach(order => {
        console.log(`     - ${order.order_number} (user_id: ${order.user_id || 'NULL'})`)
      })
    }

    // Step 3: Clean up orphaned data
    console.log('\n3. Cleaning up orphaned data...')
    
    let totalDeleted = 0

    // Delete orphaned plan_items first (they reference plans)
    if (orphanedPlans.length > 0) {
      const orphanedPlanIds = orphanedPlans.map(plan => plan.id)
      const { error: planItemsError } = await supabase
        .from('plan_items')
        .delete()
        .in('plan_id', orphanedPlanIds)
      
      if (planItemsError) {
        console.log('   ⚠️  Error deleting orphaned plan_items:', planItemsError.message)
      } else {
        console.log('   ✅ Deleted orphaned plan_items')
      }
    }

    // Delete orphaned subscriptions
    if (orphanedSubscriptions.length > 0) {
      const orphanedSubIds = orphanedSubscriptions.map(sub => sub.id)
      const { error: subError } = await supabase
        .from('subscriptions')
        .delete()
        .in('id', orphanedSubIds)
      
      if (subError) {
        console.log('   ⚠️  Error deleting orphaned subscriptions:', subError.message)
      } else {
        console.log(`   ✅ Deleted ${orphanedSubscriptions.length} orphaned subscriptions`)
        totalDeleted += orphanedSubscriptions.length
      }
    }

    // Delete orphaned orders
    if (orphanedOrders.length > 0) {
      const orphanedOrderIds = orphanedOrders.map(order => order.id)
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .in('id', orphanedOrderIds)
      
      if (orderError) {
        console.log('   ⚠️  Error deleting orphaned orders:', orderError.message)
      } else {
        console.log(`   ✅ Deleted ${orphanedOrders.length} orphaned orders`)
        totalDeleted += orphanedOrders.length
      }
    }

    // Delete orphaned plans
    if (orphanedPlans.length > 0) {
      const orphanedPlanIds = orphanedPlans.map(plan => plan.id)
      const { error: planError } = await supabase
        .from('plans')
        .delete()
        .in('id', orphanedPlanIds)
      
      if (planError) {
        console.log('   ⚠️  Error deleting orphaned plans:', planError.message)
      } else {
        console.log(`   ✅ Deleted ${orphanedPlans.length} orphaned plans`)
        totalDeleted += orphanedPlans.length
      }
    }

    // Delete orphaned dogs
    if (orphanedDogs.length > 0) {
      const orphanedDogIds = orphanedDogs.map(dog => dog.id)
      const { error: dogError } = await supabase
        .from('dogs')
        .delete()
        .in('id', orphanedDogIds)
      
      if (dogError) {
        console.log('   ⚠️  Error deleting orphaned dogs:', dogError.message)
      } else {
        console.log(`   ✅ Deleted ${orphanedDogs.length} orphaned dogs`)
        totalDeleted += orphanedDogs.length
      }
    }

    // Step 4: Verify cleanup
    console.log('\n4. Verifying cleanup...')
    
    const { data: remainingOrphanedDogs } = await supabase
      .from('dogs')
      .select('id, user_id')
      .not('user_id', 'in', `(${validUserIds.join(',')})`)
    
    const { data: remainingOrphanedPlans } = await supabase
      .from('plans')
      .select('id, user_id')
      .not('user_id', 'in', `(${validUserIds.join(',')})`)
    
    const { data: remainingOrphanedSubscriptions } = await supabase
      .from('subscriptions')
      .select('id, user_id')
      .not('user_id', 'in', `(${validUserIds.join(',')})`)
    
    const { data: remainingOrphanedOrders } = await supabase
      .from('orders')
      .select('id, user_id')
      .not('user_id', 'in', `(${validUserIds.join(',')})`)

    const remainingOrphaned = (remainingOrphanedDogs?.length || 0) + 
                             (remainingOrphanedPlans?.length || 0) + 
                             (remainingOrphanedSubscriptions?.length || 0) + 
                             (remainingOrphanedOrders?.length || 0)

    console.log(`   Remaining orphaned records: ${remainingOrphaned}`)

    // Step 5: Summary
    console.log('\n📊 Cleanup Summary:')
    console.log('   ========================================')
    console.log(`   Total records deleted: ${totalDeleted}`)
    console.log(`   Remaining orphaned records: ${remainingOrphaned}`)
    
    if (remainingOrphaned === 0) {
      console.log('   ✅ All orphaned data has been cleaned up!')
      console.log('   You can now run the CASCADE DELETE constraints script.')
    } else {
      console.log('   ⚠️  Some orphaned data still remains.')
      console.log('   You may need to run this script again or check manually.')
    }
    
    console.log('   ========================================')

  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error)
  }
}

// Run the cleanup
cleanupOrphanedData().catch(console.error)