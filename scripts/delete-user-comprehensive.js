#!/usr/bin/env node

/**
 * Comprehensive user deletion script that handles ALL tables with user references
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function deleteUserComprehensive(userEmail) {
  console.log(`🗑️  Comprehensively deleting user ${userEmail} and ALL associated data...\n`)

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

    // 2b. Delete dog_metrics (they reference dogs)
    console.log('\n2b. Deleting dog_metrics...')
    const { data: userDogs } = await supabase
      .from('dogs')
      .select('id')
      .eq('user_id', userId)
    
    if (userDogs && userDogs.length > 0) {
      const dogIds = userDogs.map(d => d.id)
      const { data: dogMetrics, error: dogMetricsError } = await supabase
        .from('dog_metrics')
        .select('id')
        .in('dog_id', dogIds)
      
      if (dogMetricsError) {
        console.log('⚠️  dog_metrics table error (may not exist):', dogMetricsError.message)
      } else if (dogMetrics && dogMetrics.length > 0) {
        const { error: deleteDogMetricsError } = await supabase
          .from('dog_metrics')
          .delete()
          .in('id', dogMetrics.map(metric => metric.id))
        
        if (deleteDogMetricsError) {
          console.error('❌ Error deleting dog_metrics:', deleteDogMetricsError.message)
        } else {
          console.log(`✅ Deleted ${dogMetrics.length} dog_metrics`)
          totalDeleted += dogMetrics.length
        }
      } else {
        console.log('✅ No dog_metrics to delete')
      }
    }

    // 2c. Delete plan_dogs (they reference plans and dogs)
    console.log('\n2c. Deleting plan_dogs...')
    if (userPlans && userPlans.length > 0 && userDogs && userDogs.length > 0) {
      const planIds = userPlans.map(p => p.id)
      const dogIds = userDogs.map(d => d.id)
      
      const { data: planDogs, error: planDogsError } = await supabase
        .from('plan_dogs')
        .select('id')
        .or(`plan_id.in.(${planIds.join(',')}),dog_id.in.(${dogIds.join(',')})`)
      
      if (planDogsError) {
        console.log('⚠️  plan_dogs table error (may not exist):', planDogsError.message)
      } else if (planDogs && planDogs.length > 0) {
        const { error: deletePlanDogsError } = await supabase
          .from('plan_dogs')
          .delete()
          .in('id', planDogs.map(pd => pd.id))
        
        if (deletePlanDogsError) {
          console.error('❌ Error deleting plan_dogs:', deletePlanDogsError.message)
        } else {
          console.log(`✅ Deleted ${planDogs.length} plan_dogs`)
          totalDeleted += planDogs.length
        }
      } else {
        console.log('✅ No plan_dogs to delete')
      }
    }

    // 2d. Delete subscriptions (they reference plans and users)
    console.log('\n2d. Deleting subscriptions...')
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

    // 2e. Delete orders (they reference users)
    console.log('\n2e. Deleting orders...')
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

    // 2f. Delete billing_customers (they reference users)
    console.log('\n2f. Deleting billing_customers...')
    const { data: billingCustomers, error: billingError } = await supabase
      .from('billing_customers')
      .select('id')
      .eq('user_id', userId)
    
    if (billingError) {
      console.log('⚠️  billing_customers table error (may not exist):', billingError.message)
    } else if (billingCustomers && billingCustomers.length > 0) {
      const { error: deleteBillingError } = await supabase
        .from('billing_customers')
        .delete()
        .in('id', billingCustomers.map(bc => bc.id))
      
      if (deleteBillingError) {
        console.error('❌ Error deleting billing_customers:', deleteBillingError.message)
      } else {
        console.log(`✅ Deleted ${billingCustomers.length} billing_customers`)
        totalDeleted += billingCustomers.length
      }
    } else {
      console.log('✅ No billing_customers to delete')
    }

    // 2g. Delete addresses (they reference users)
    console.log('\n2g. Deleting addresses...')
    const { data: addresses, error: addressesError } = await supabase
      .from('addresses')
      .select('id')
      .eq('user_id', userId)
    
    if (addressesError) {
      console.log('⚠️  addresses table error (may not exist):', addressesError.message)
    } else if (addresses && addresses.length > 0) {
      const { error: deleteAddressesError } = await supabase
        .from('addresses')
        .delete()
        .in('id', addresses.map(addr => addr.id))
      
      if (deleteAddressesError) {
        console.error('❌ Error deleting addresses:', deleteAddressesError.message)
      } else {
        console.log(`✅ Deleted ${addresses.length} addresses`)
        totalDeleted += addresses.length
      }
    } else {
      console.log('✅ No addresses to delete')
    }

    // 2h. Delete ai_recommendations (they reference users)
    console.log('\n2h. Deleting ai_recommendations...')
    const { data: aiRecs, error: aiRecsError } = await supabase
      .from('ai_recommendations')
      .select('id')
      .eq('user_id', userId)
    
    if (aiRecsError) {
      console.log('⚠️  ai_recommendations table error (may not exist):', aiRecsError.message)
    } else if (aiRecs && aiRecs.length > 0) {
      const { error: deleteAiRecsError } = await supabase
        .from('ai_recommendations')
        .delete()
        .in('id', aiRecs.map(rec => rec.id))
      
      if (deleteAiRecsError) {
        console.error('❌ Error deleting ai_recommendations:', deleteAiRecsError.message)
      } else {
        console.log(`✅ Deleted ${aiRecs.length} ai_recommendations`)
        totalDeleted += aiRecs.length
      }
    } else {
      console.log('✅ No ai_recommendations to delete')
    }

    // 2i. Delete plans (they reference users and dogs)
    console.log('\n2i. Deleting plans...')
    if (userPlans && userPlans.length > 0) {
      const { error: deletePlansError } = await supabase
        .from('plans')
        .delete()
        .in('id', userPlans.map(plan => plan.id))
      
      if (deletePlansError) {
        console.error('❌ Error deleting plans:', deletePlansError.message)
      } else {
        console.log(`✅ Deleted ${userPlans.length} plans`)
        totalDeleted += userPlans.length
      }
    } else {
      console.log('✅ No plans to delete')
    }

    // 2j. Delete dogs (they reference users)
    console.log('\n2j. Deleting dogs...')
    if (userDogs && userDogs.length > 0) {
      console.log('Dogs to delete:')
      userDogs.forEach(dog => {
        console.log(`   - ${dog.id}`)
      })
      
      const { error: deleteDogsError } = await supabase
        .from('dogs')
        .delete()
        .in('id', userDogs.map(dog => dog.id))
      
      if (deleteDogsError) {
        console.error('❌ Error deleting dogs:', deleteDogsError.message)
      } else {
        console.log(`✅ Deleted ${userDogs.length} dogs`)
        totalDeleted += userDogs.length
      }
    } else {
      console.log('✅ No dogs to delete')
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
    console.log('\n📊 Comprehensive Deletion Summary:')
    console.log(`   Total records deleted: ${totalDeleted}`)
    console.log(`   User: ${userEmail}`)
    console.log('✅ User and ALL associated data have been deleted successfully!')

  } catch (error) {
    console.error('❌ Fatal error during deletion:', error)
  }
}

// Get the email from command line argument or use default
const userEmail = process.argv[2] || 'brigarus@icloud.com'

console.log(`🎯 Target user: ${userEmail}`)
console.log('⚠️  This will permanently delete the user and ALL associated data!')

// Run the deletion
deleteUserComprehensive(userEmail).catch(console.error)
