#!/usr/bin/env node

/**
 * Clean up all orphaned data before creating foreign key constraints
 * This script removes all data that references non-existent users
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
  console.log('🧹 Cleaning up orphaned data before creating foreign key constraints...\n')

  try {
    // Step 1: Get all valid user IDs
    console.log('1. Getting valid user IDs...')
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error getting users:', usersError.message)
      return
    }
    
    const validUserIds = new Set(users.users.map(u => u.id))
    console.log(`   Found ${validUserIds.size} valid users`)
    validUserIds.forEach(id => console.log(`   - ${id}`))

    // Step 2: Find and delete orphaned data
    console.log('\n2. Finding and deleting orphaned data...')
    
    let totalDeleted = 0

    // Delete orphaned plan_items first (they reference plans and dogs)
    console.log('   Deleting orphaned plan_items...')
    const { data: allPlanItems, error: planItemsError } = await supabase
      .from('plan_items')
      .select('id, plan_id')
    
    if (planItemsError) {
      console.error('   ❌ Error getting plan_items:', planItemsError.message)
    } else {
      // Get all plan IDs to check which ones are orphaned
      const { data: allPlans, error: plansError } = await supabase
        .from('plans')
        .select('id, user_id')
      
      if (plansError) {
        console.error('   ❌ Error getting plans:', plansError.message)
      } else {
        const orphanedPlanIds = new Set(
          allPlans
            .filter(plan => plan.user_id && !validUserIds.has(plan.user_id))
            .map(plan => plan.id)
        )
        
        const orphanedPlanItems = allPlanItems.filter(item => orphanedPlanIds.has(item.plan_id))
        
        if (orphanedPlanItems.length > 0) {
          const { error: deleteError } = await supabase
            .from('plan_items')
            .delete()
            .in('id', orphanedPlanItems.map(item => item.id))
          
          if (deleteError) {
            console.error('   ❌ Error deleting orphaned plan_items:', deleteError.message)
          } else {
            console.log(`   ✅ Deleted ${orphanedPlanItems.length} orphaned plan_items`)
            totalDeleted += orphanedPlanItems.length
          }
        } else {
          console.log('   ✅ No orphaned plan_items found')
        }
      }
    }

    // Delete orphaned subscriptions
    console.log('   Deleting orphaned subscriptions...')
    const { data: allSubscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('id, user_id')
    
    if (subsError) {
      console.error('   ❌ Error getting subscriptions:', subsError.message)
    } else {
      const orphanedSubscriptions = allSubscriptions.filter(sub => 
        sub.user_id && !validUserIds.has(sub.user_id)
      )
      
      if (orphanedSubscriptions.length > 0) {
        const { error: deleteError } = await supabase
          .from('subscriptions')
          .delete()
          .in('id', orphanedSubscriptions.map(sub => sub.id))
        
        if (deleteError) {
          console.error('   ❌ Error deleting orphaned subscriptions:', deleteError.message)
        } else {
          console.log(`   ✅ Deleted ${orphanedSubscriptions.length} orphaned subscriptions`)
          totalDeleted += orphanedSubscriptions.length
        }
      } else {
        console.log('   ✅ No orphaned subscriptions found')
      }
    }

    // Delete orphaned orders
    console.log('   Deleting orphaned orders...')
    const { data: allOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, user_id')
    
    if (ordersError) {
      console.error('   ❌ Error getting orders:', ordersError.message)
    } else {
      const orphanedOrders = allOrders.filter(order => 
        order.user_id && !validUserIds.has(order.user_id)
      )
      
      if (orphanedOrders.length > 0) {
        const { error: deleteError } = await supabase
          .from('orders')
          .delete()
          .in('id', orphanedOrders.map(order => order.id))
        
        if (deleteError) {
          console.error('   ❌ Error deleting orphaned orders:', deleteError.message)
        } else {
          console.log(`   ✅ Deleted ${orphanedOrders.length} orphaned orders`)
          totalDeleted += orphanedOrders.length
        }
      } else {
        console.log('   ✅ No orphaned orders found')
      }
    }

    // Delete orphaned plans
    console.log('   Deleting orphaned plans...')
    const { data: allPlans, error: plansError } = await supabase
      .from('plans')
      .select('id, user_id')
    
    if (plansError) {
      console.error('   ❌ Error getting plans:', plansError.message)
    } else {
      const orphanedPlans = allPlans.filter(plan => 
        plan.user_id && !validUserIds.has(plan.user_id)
      )
      
      if (orphanedPlans.length > 0) {
        const { error: deleteError } = await supabase
          .from('plans')
          .delete()
          .in('id', orphanedPlans.map(plan => plan.id))
        
        if (deleteError) {
          console.error('   ❌ Error deleting orphaned plans:', deleteError.message)
        } else {
          console.log(`   ✅ Deleted ${orphanedPlans.length} orphaned plans`)
          totalDeleted += orphanedPlans.length
        }
      } else {
        console.log('   ✅ No orphaned plans found')
      }
    }

    // Delete orphaned dogs
    console.log('   Deleting orphaned dogs...')
    const { data: allDogs, error: dogsError } = await supabase
      .from('dogs')
      .select('id, name, user_id')
    
    if (dogsError) {
      console.error('   ❌ Error getting dogs:', dogsError.message)
    } else {
      const orphanedDogs = allDogs.filter(dog => 
        dog.user_id && !validUserIds.has(dog.user_id)
      )
      
      if (orphanedDogs.length > 0) {
        console.log('   Orphaned dogs to delete:')
        orphanedDogs.forEach(dog => {
          console.log(`     - ${dog.name} (${dog.id}) -> User ID: ${dog.user_id}`)
        })
        
        const { error: deleteError } = await supabase
          .from('dogs')
          .delete()
          .in('id', orphanedDogs.map(dog => dog.id))
        
        if (deleteError) {
          console.error('   ❌ Error deleting orphaned dogs:', deleteError.message)
        } else {
          console.log(`   ✅ Deleted ${orphanedDogs.length} orphaned dogs`)
          totalDeleted += orphanedDogs.length
        }
      } else {
        console.log('   ✅ No orphaned dogs found')
      }
    }

    // Step 3: Verify cleanup
    console.log('\n3. Verifying cleanup...')
    
    const { data: remainingDogs } = await supabase
      .from('dogs')
      .select('id, user_id')
    
    const { data: remainingPlans } = await supabase
      .from('plans')
      .select('id, user_id')
    
    const { data: remainingSubscriptions } = await supabase
      .from('subscriptions')
      .select('id, user_id')
    
    const { data: remainingOrders } = await supabase
      .from('orders')
      .select('id, user_id')
    
    const remainingOrphanedDogs = remainingDogs?.filter(dog => 
      dog.user_id && !validUserIds.has(dog.user_id)
    ) || []
    
    const remainingOrphanedPlans = remainingPlans?.filter(plan => 
      plan.user_id && !validUserIds.has(plan.user_id)
    ) || []
    
    const remainingOrphanedSubscriptions = remainingSubscriptions?.filter(sub => 
      sub.user_id && !validUserIds.has(sub.user_id)
    ) || []
    
    const remainingOrphanedOrders = remainingOrders?.filter(order => 
      order.user_id && !validUserIds.has(order.user_id)
    ) || []
    
    console.log(`   Remaining orphaned dogs: ${remainingOrphanedDogs.length}`)
    console.log(`   Remaining orphaned plans: ${remainingOrphanedPlans.length}`)
    console.log(`   Remaining orphaned subscriptions: ${remainingOrphanedSubscriptions.length}`)
    console.log(`   Remaining orphaned orders: ${remainingOrphanedOrders.length}`)
    
    // Step 4: Summary
    console.log('\n4. Cleanup Summary:')
    console.log(`   Total records deleted: ${totalDeleted}`)
    
    if (remainingOrphanedDogs.length === 0 && 
        remainingOrphanedPlans.length === 0 && 
        remainingOrphanedSubscriptions.length === 0 && 
        remainingOrphanedOrders.length === 0) {
      console.log('   ✅ All orphaned data has been cleaned up!')
      console.log('   🎉 You can now safely run the foreign key constraint SQL commands.')
    } else {
      console.log('   ⚠️  Some orphaned data still remains.')
      console.log('   You may need to run this script again or check for other issues.')
    }

  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error)
  }
}

// Run the cleanup
cleanupOrphanedData().catch(console.error)
