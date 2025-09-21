#!/usr/bin/env node

/**
 * Check for orphaned data from deleted users
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkOrphanedData() {
  console.log('🔍 Checking for orphaned data from deleted users...\n')

  try {
    // Get all current users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message)
      return
    }
    
    const userIds = users.users.map(user => user.id)
    console.log(`Found ${userIds.length} active users`)
    
    if (userIds.length === 0) {
      console.log('📝 No active users found')
    }
    
    let totalOrphaned = 0
    
    // Check dogs
    console.log('\n📋 Checking dogs...')
    const { data: allDogs, error: dogsError } = await supabase
      .from('dogs')
      .select('id, name, user_id')
    
    if (dogsError) {
      console.log('❌ Error fetching dogs:', dogsError.message)
    } else {
      const orphanedDogs = allDogs.filter(dog => !userIds.includes(dog.user_id))
      console.log(`   Total dogs: ${allDogs.length}`)
      console.log(`   Orphaned dogs: ${orphanedDogs.length}`)
      
      if (orphanedDogs.length > 0) {
        console.log('   🚨 Orphaned dogs:')
        orphanedDogs.forEach(dog => {
          console.log(`      - ${dog.name} (ID: ${dog.id}, user_id: ${dog.user_id})`)
        })
        totalOrphaned += orphanedDogs.length
      }
    }
    
    // Check plans
    console.log('\n📋 Checking plans...')
    const { data: allPlans, error: plansError } = await supabase
      .from('plans')
      .select('id, user_id, status')
    
    if (plansError) {
      console.log('❌ Error fetching plans:', plansError.message)
    } else {
      const orphanedPlans = allPlans.filter(plan => !userIds.includes(plan.user_id))
      console.log(`   Total plans: ${allPlans.length}`)
      console.log(`   Orphaned plans: ${orphanedPlans.length}`)
      
      if (orphanedPlans.length > 0) {
        console.log('   🚨 Orphaned plans:')
        orphanedPlans.forEach(plan => {
          console.log(`      - Plan ${plan.id} (user_id: ${plan.user_id}, status: ${plan.status})`)
        })
        totalOrphaned += orphanedPlans.length
      }
    }
    
    // Check plan_items
    console.log('\n📋 Checking plan_items...')
    const { data: allPlanItems, error: planItemsError } = await supabase
      .from('plan_items')
      .select('id, plan_id, dog_id')
    
    if (planItemsError) {
      console.log('❌ Error fetching plan_items:', planItemsError.message)
    } else {
      // Get all valid plan IDs
      const { data: validPlans } = await supabase
        .from('plans')
        .select('id')
        .in('user_id', userIds)
      
      const validPlanIds = validPlans ? validPlans.map(p => p.id) : []
      const orphanedPlanItems = allPlanItems.filter(item => !validPlanIds.includes(item.plan_id))
      
      console.log(`   Total plan_items: ${allPlanItems.length}`)
      console.log(`   Orphaned plan_items: ${orphanedPlanItems.length}`)
      
      if (orphanedPlanItems.length > 0) {
        console.log('   🚨 Orphaned plan_items:')
        orphanedPlanItems.forEach(item => {
          console.log(`      - Item ${item.id} (plan_id: ${item.plan_id})`)
        })
        totalOrphaned += orphanedPlanItems.length
      }
    }
    
    // Check subscriptions
    console.log('\n📋 Checking subscriptions...')
    const { data: allSubscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('id, user_id, status')
    
    if (subscriptionsError) {
      console.log('❌ Error fetching subscriptions:', subscriptionsError.message)
    } else {
      const orphanedSubscriptions = allSubscriptions.filter(sub => !userIds.includes(sub.user_id))
      console.log(`   Total subscriptions: ${allSubscriptions.length}`)
      console.log(`   Orphaned subscriptions: ${orphanedSubscriptions.length}`)
      
      if (orphanedSubscriptions.length > 0) {
        console.log('   🚨 Orphaned subscriptions:')
        orphanedSubscriptions.forEach(sub => {
          console.log(`      - Sub ${sub.id} (user_id: ${sub.user_id}, status: ${sub.status})`)
        })
        totalOrphaned += orphanedSubscriptions.length
      }
    }
    
    // Check orders
    console.log('\n📋 Checking orders...')
    const { data: allOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, user_id, status')
    
    if (ordersError) {
      console.log('❌ Error fetching orders:', ordersError.message)
    } else {
      const orphanedOrders = allOrders.filter(order => !userIds.includes(order.user_id))
      console.log(`   Total orders: ${allOrders.length}`)
      console.log(`   Orphaned orders: ${orphanedOrders.length}`)
      
      if (orphanedOrders.length > 0) {
        console.log('   🚨 Orphaned orders:')
        orphanedOrders.forEach(order => {
          console.log(`      - Order ${order.id} (user_id: ${order.user_id}, status: ${order.status})`)
        })
        totalOrphaned += orphanedOrders.length
      }
    }
    
    // Check additional tables if they exist
    const additionalTables = ['dog_metrics', 'plan_dogs', 'addresses', 'ai_recommendations']
    
    for (const tableName of additionalTables) {
      console.log(`\n📋 Checking ${tableName}...`)
      
      try {
        const { data: allRecords, error: tableError } = await supabase
          .from(tableName)
          .select('*')
          .limit(100) // Limit to avoid large datasets
        
        if (tableError) {
          if (tableError.code === 'PGRST116') {
            console.log(`   📝 Table ${tableName} doesn't exist`)
          } else {
            console.log(`   ❌ Error fetching ${tableName}:`, tableError.message)
          }
        } else {
          console.log(`   Total ${tableName}: ${allRecords.length}`)
          
          // Check for orphaned records based on user_id or related IDs
          let orphanedCount = 0
          
          if (tableName === 'dog_metrics') {
            // Check if dog_id references valid dogs
            const { data: validDogs } = await supabase
              .from('dogs')
              .select('id')
              .in('user_id', userIds)
            
            const validDogIds = validDogs ? validDogs.map(d => d.id) : []
            orphanedCount = allRecords.filter(record => !validDogIds.includes(record.dog_id)).length
          } else if (tableName === 'plan_dogs') {
            // Check if plan_id references valid plans
            const { data: validPlans } = await supabase
              .from('plans')
              .select('id')
              .in('user_id', userIds)
            
            const validPlanIds = validPlans ? validPlans.map(p => p.id) : []
            orphanedCount = allRecords.filter(record => !validPlanIds.includes(record.plan_id)).length
          } else {
            // Check user_id directly
            orphanedCount = allRecords.filter(record => !userIds.includes(record.user_id)).length
          }
          
          console.log(`   Orphaned ${tableName}: ${orphanedCount}`)
          totalOrphaned += orphanedCount
        }
      } catch (e) {
        console.log(`   ❌ Exception checking ${tableName}:`, e.message)
      }
    }
    
    // Summary
    console.log('\n📊 Summary:')
    console.log(`   Active users: ${userIds.length}`)
    console.log(`   Total orphaned records: ${totalOrphaned}`)
    
    if (totalOrphaned === 0) {
      console.log('\n🎉 No orphaned data found! Database is clean.')
    } else {
      console.log('\n⚠️  Orphaned data found! Consider running cleanup script.')
      console.log('   Run: node scripts/cleanup-orphaned-data.js --cleanup')
    }
    
  } catch (error) {
    console.error('❌ Fatal error during check:', error)
  }
}

async function cleanupOrphanedData() {
  console.log('🧹 Cleaning up orphaned data...\n')

  try {
    // Get all current users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message)
      return
    }
    
    const userIds = users.users.map(user => user.id)
    console.log(`Found ${userIds.length} active users`)
    
    let totalCleaned = 0
    
    // Clean up orphaned plan_items first
    console.log('\n🧹 Cleaning plan_items...')
    const { data: allPlanItems } = await supabase.from('plan_items').select('id, plan_id')
    const { data: validPlans } = await supabase.from('plans').select('id').in('user_id', userIds)
    const validPlanIds = validPlans ? validPlans.map(p => p.id) : []
    const orphanedPlanItems = allPlanItems.filter(item => !validPlanIds.includes(item.plan_id))
    
    if (orphanedPlanItems.length > 0) {
      const { error: deleteError } = await supabase
        .from('plan_items')
        .delete()
        .in('id', orphanedPlanItems.map(item => item.id))
      
      if (deleteError) {
        console.log('❌ Error deleting orphaned plan_items:', deleteError.message)
      } else {
        console.log(`✅ Deleted ${orphanedPlanItems.length} orphaned plan_items`)
        totalCleaned += orphanedPlanItems.length
      }
    }
    
    // Clean up orphaned plans
    console.log('\n🧹 Cleaning plans...')
    const { data: allPlans } = await supabase.from('plans').select('id, user_id')
    const orphanedPlans = allPlans.filter(plan => !userIds.includes(plan.user_id))
    
    if (orphanedPlans.length > 0) {
      const { error: deleteError } = await supabase
        .from('plans')
        .delete()
        .in('id', orphanedPlans.map(plan => plan.id))
      
      if (deleteError) {
        console.log('❌ Error deleting orphaned plans:', deleteError.message)
      } else {
        console.log(`✅ Deleted ${orphanedPlans.length} orphaned plans`)
        totalCleaned += orphanedPlans.length
      }
    }
    
    // Clean up orphaned subscriptions
    console.log('\n🧹 Cleaning subscriptions...')
    const { data: allSubscriptions } = await supabase.from('subscriptions').select('id, user_id')
    const orphanedSubscriptions = allSubscriptions.filter(sub => !userIds.includes(sub.user_id))
    
    if (orphanedSubscriptions.length > 0) {
      const { error: deleteError } = await supabase
        .from('subscriptions')
        .delete()
        .in('id', orphanedSubscriptions.map(sub => sub.id))
      
      if (deleteError) {
        console.log('❌ Error deleting orphaned subscriptions:', deleteError.message)
      } else {
        console.log(`✅ Deleted ${orphanedSubscriptions.length} orphaned subscriptions`)
        totalCleaned += orphanedSubscriptions.length
      }
    }
    
    // Clean up orphaned orders
    console.log('\n🧹 Cleaning orders...')
    const { data: allOrders } = await supabase.from('orders').select('id, user_id')
    const orphanedOrders = allOrders.filter(order => !userIds.includes(order.user_id))
    
    if (orphanedOrders.length > 0) {
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .in('id', orphanedOrders.map(order => order.id))
      
      if (deleteError) {
        console.log('❌ Error deleting orphaned orders:', deleteError.message)
      } else {
        console.log(`✅ Deleted ${orphanedOrders.length} orphaned orders`)
        totalCleaned += orphanedOrders.length
      }
    }
    
    // Clean up orphaned dogs
    console.log('\n🧹 Cleaning dogs...')
    const { data: allDogs } = await supabase.from('dogs').select('id, user_id')
    const orphanedDogs = allDogs.filter(dog => !userIds.includes(dog.user_id))
    
    if (orphanedDogs.length > 0) {
      const { error: deleteError } = await supabase
        .from('dogs')
        .delete()
        .in('id', orphanedDogs.map(dog => dog.id))
      
      if (deleteError) {
        console.log('❌ Error deleting orphaned dogs:', deleteError.message)
      } else {
        console.log(`✅ Deleted ${orphanedDogs.length} orphaned dogs`)
        totalCleaned += orphanedDogs.length
      }
    }
    
    console.log(`\n🎉 Cleanup completed! Removed ${totalCleaned} orphaned records.`)
    
  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error)
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--cleanup')) {
    await cleanupOrphanedData()
  } else {
    await checkOrphanedData()
    
    if (args.includes('--help')) {
      console.log('\nUsage:')
      console.log('  node check-orphaned-data.js           # Check for orphaned data')
      console.log('  node check-orphaned-data.js --cleanup # Clean up orphaned data')
      console.log('  node check-orphaned-data.js --help    # Show this help')
    }
  }
}

main().catch(console.error)
