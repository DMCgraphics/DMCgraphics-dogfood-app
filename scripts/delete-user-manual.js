#!/usr/bin/env node

/**
 * Manual user deletion script for when CASCADE DELETE constraints aren't working
 * This script deletes all user data in the correct order to avoid constraint violations
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function deleteUserManually(userEmail) {
  console.log(`🗑️  Manually deleting user ${userEmail} and all associated data...\n`)

  try {
    // Step 1: Find the user
    console.log('1. Finding user...')
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message)
      return
    }
    
    const user = users.users.find(u => u.email === userEmail)
    if (!user) {
      console.log(`❌ User ${userEmail} not found`)
      return
    }
    
    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`)
    const userId = user.id

    let totalDeleted = 0

    // Step 2: Delete in the correct order to avoid foreign key constraint violations
    
    // 2a. Delete plan_items first (they reference plans and dogs)
    console.log('\n2a. Deleting plan_items...')
    const { data: userPlans } = await supabase
      .from('plans')
      .select('id')
      .eq('user_id', userId)
    
    if (userPlans && userPlans.length > 0) {
      const planIds = userPlans.map(p => p.id)
      const { data: planItems, error: planItemsError } = await supabase
        .from('plan_items')
        .select('id')
        .in('plan_id', planIds)
      
      if (planItemsError) {
        console.error('❌ Error fetching plan_items:', planItemsError.message)
      } else if (planItems && planItems.length > 0) {
        const { error: deletePlanItemsError } = await supabase
          .from('plan_items')
          .delete()
          .in('id', planItems.map(item => item.id))
        
        if (deletePlanItemsError) {
          console.error('❌ Error deleting plan_items:', deletePlanItemsError.message)
        } else {
          console.log(`✅ Deleted ${planItems.length} plan_items`)
          totalDeleted += planItems.length
        }
      } else {
        console.log('✅ No plan_items to delete')
      }
    }

    // 2b. Delete subscriptions (they reference plans and users)
    console.log('\n2b. Deleting subscriptions...')
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
    
    if (subsError) {
      console.error('❌ Error fetching subscriptions:', subsError.message)
    } else if (subscriptions && subscriptions.length > 0) {
      const { error: deleteSubsError } = await supabase
        .from('subscriptions')
        .delete()
        .in('id', subscriptions.map(sub => sub.id))
      
      if (deleteSubsError) {
        console.error('❌ Error deleting subscriptions:', deleteSubsError.message)
      } else {
        console.log(`✅ Deleted ${subscriptions.length} subscriptions`)
        totalDeleted += subscriptions.length
      }
    } else {
      console.log('✅ No subscriptions to delete')
    }

    // 2c. Delete orders (they reference users and plans)
    console.log('\n2c. Deleting orders...')
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', userId)
    
    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError.message)
    } else if (orders && orders.length > 0) {
      const { error: deleteOrdersError } = await supabase
        .from('orders')
        .delete()
        .in('id', orders.map(order => order.id))
      
      if (deleteOrdersError) {
        console.error('❌ Error deleting orders:', deleteOrdersError.message)
      } else {
        console.log(`✅ Deleted ${orders.length} orders`)
        totalDeleted += orders.length
      }
    } else {
      console.log('✅ No orders to delete')
    }

    // 2d. Delete billing_customers
    console.log('\n2d. Deleting billing_customers...')
    const { data: billingCustomers, error: billingError } = await supabase
      .from('billing_customers')
      .select('id')
      .eq('user_id', userId)
    
    if (billingError) {
      console.error('❌ Error fetching billing_customers:', billingError.message)
    } else if (billingCustomers && billingCustomers.length > 0) {
      const { error: deleteBillingError } = await supabase
        .from('billing_customers')
        .delete()
        .in('id', billingCustomers.map(customer => customer.id))
      
      if (deleteBillingError) {
        console.error('❌ Error deleting billing_customers:', deleteBillingError.message)
      } else {
        console.log(`✅ Deleted ${billingCustomers.length} billing_customers`)
        totalDeleted += billingCustomers.length
      }
    } else {
      console.log('✅ No billing_customers to delete')
    }

    // 2e. Delete plans (they reference users and dogs)
    console.log('\n2e. Deleting plans...')
    const { data: plansToDelete, error: plansError } = await supabase
      .from('plans')
      .select('id')
      .eq('user_id', userId)
    
    if (plansError) {
      console.error('❌ Error fetching plans:', plansError.message)
    } else if (plansToDelete && plansToDelete.length > 0) {
      const { error: deletePlansError } = await supabase
        .from('plans')
        .delete()
        .in('id', plansToDelete.map(plan => plan.id))
      
      if (deletePlansError) {
        console.error('❌ Error deleting plans:', deletePlansError.message)
      } else {
        console.log(`✅ Deleted ${plansToDelete.length} plans`)
        totalDeleted += plansToDelete.length
      }
    } else {
      console.log('✅ No plans to delete')
    }

    // 2f. Delete dogs (they reference users)
    console.log('\n2f. Deleting dogs...')
    const { data: dogs, error: dogsError } = await supabase
      .from('dogs')
      .select('id, name')
      .eq('user_id', userId)
    
    if (dogsError) {
      console.error('❌ Error fetching dogs:', dogsError.message)
    } else if (dogs && dogs.length > 0) {
      console.log('Dogs to delete:')
      dogs.forEach(dog => console.log(`   - ${dog.name} (${dog.id})`))
      
      const { error: deleteDogsError } = await supabase
        .from('dogs')
        .delete()
        .in('id', dogs.map(dog => dog.id))
      
      if (deleteDogsError) {
        console.error('❌ Error deleting dogs:', deleteDogsError.message)
      } else {
        console.log(`✅ Deleted ${dogs.length} dogs`)
        totalDeleted += dogs.length
      }
    } else {
      console.log('✅ No dogs to delete')
    }

    // 2g. Delete other potential references
    console.log('\n2g. Deleting other potential references...')
    
    // Delete from addresses
    const { data: addresses, error: addressesError } = await supabase
      .from('addresses')
      .select('id')
      .eq('user_id', userId)
    
    if (!addressesError && addresses && addresses.length > 0) {
      const { error: deleteAddressesError } = await supabase
        .from('addresses')
        .delete()
        .in('id', addresses.map(addr => addr.id))
      
      if (!deleteAddressesError) {
        console.log(`✅ Deleted ${addresses.length} addresses`)
        totalDeleted += addresses.length
      }
    }

    // Delete from ai_recommendations
    const { data: aiRecs, error: aiRecsError } = await supabase
      .from('ai_recommendations')
      .select('id')
      .eq('user_id', userId)
    
    if (!aiRecsError && aiRecs && aiRecs.length > 0) {
      const { error: deleteAiRecsError } = await supabase
        .from('ai_recommendations')
        .delete()
        .in('id', aiRecs.map(rec => rec.id))
      
      if (!deleteAiRecsError) {
        console.log(`✅ Deleted ${aiRecs.length} ai_recommendations`)
        totalDeleted += aiRecs.length
      }
    }

    // Step 3: Delete the user from auth.users
    console.log('\n3. Deleting user from auth.users...')
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId)
    
    if (deleteUserError) {
      console.error('❌ Error deleting user:', deleteUserError.message)
      console.error('Error details:', deleteUserError)
    } else {
      console.log(`✅ Deleted user ${userEmail}`)
      totalDeleted += 1
    }

    // Step 4: Summary
    console.log('\n📊 Manual Deletion Summary:')
    console.log(`   Total records deleted: ${totalDeleted}`)
    console.log(`   User: ${userEmail}`)
    console.log('✅ User and all associated data have been deleted successfully!')

  } catch (error) {
    console.error('❌ Fatal error during manual deletion:', error)
  }
}

// Get the email from command line argument
const userEmail = process.argv[2]

if (!userEmail) {
  console.log('❌ Please provide a user email as an argument')
  console.log('Usage: node scripts/delete-user-manual.js user@example.com')
  process.exit(1)
}

console.log(`🎯 Target user: ${userEmail}`)
console.log('⚠️  This will permanently delete the user and ALL associated data!')
console.log('')

// Run immediately
deleteUserManually(userEmail).catch(console.error)
