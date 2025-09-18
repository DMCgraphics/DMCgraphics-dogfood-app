#!/usr/bin/env node

// Script to delete a user and all their associated data
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function deleteUserWithCleanup(userEmail) {
  console.log(`🗑️  Deleting user ${userEmail} and all associated data...\n`)

  try {
    // Find the user
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching users:', authError)
      return
    }

    const user = authUsers.users.find(u => u.email === userEmail)
    if (!user) {
      console.error(`❌ User ${userEmail} not found`)
      return
    }

    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`)

    // Get all dogs for this user
    const { data: dogs, error: dogsError } = await supabase
      .from('dogs')
      .select('id, name')
      .eq('user_id', user.id)

    if (dogsError) {
      console.error('❌ Error fetching dogs:', dogsError)
      return
    }

    console.log(`📋 Found ${dogs.length} dogs for this user:`)
    dogs.forEach(dog => {
      console.log(`   - ${dog.name} (ID: ${dog.id})`)
    })

    // Get all plans for this user
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('id, status')
      .eq('user_id', user.id)

    if (plansError) {
      console.error('❌ Error fetching plans:', plansError)
      return
    }

    console.log(`📋 Found ${plans.length} plans for this user:`)
    plans.forEach(plan => {
      console.log(`   - Plan ${plan.id} (Status: ${plan.status})`)
    })

    // Get all subscriptions for this user
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', user.id)

    if (subscriptionsError) {
      console.error('❌ Error fetching subscriptions:', subscriptionsError)
      return
    }

    console.log(`📋 Found ${subscriptions.length} subscriptions for this user:`)
    subscriptions.forEach(sub => {
      console.log(`   - Subscription ${sub.id} (Status: ${sub.status})`)
    })

    // Confirm deletion
    console.log('\n⚠️  This will permanently delete:')
    console.log(`   - User: ${user.email}`)
    console.log(`   - ${dogs.length} dogs`)
    console.log(`   - ${plans.length} plans`)
    console.log(`   - ${subscriptions.length} subscriptions`)
    console.log(`   - All associated data (plan items, dog metrics, etc.)`)

    // For safety, we'll just show what would be deleted
    console.log('\n🔒 Safety mode: Showing what would be deleted (not actually deleting)')
    console.log('   To actually delete, modify this script to set SAFE_MODE = false')

    const SAFE_MODE = true // Set to false to actually perform deletion

    if (!SAFE_MODE) {
      console.log('\n🗑️  Starting deletion process...')

      // Delete in reverse dependency order
      for (const dog of dogs) {
        console.log(`\n🧹 Cleaning up dog: ${dog.name}`)

        // Delete dog metrics
        const { error: metricsError } = await supabase
          .from('dog_metrics')
          .delete()
          .eq('dog_id', dog.id)

        if (metricsError) {
          console.error(`   ❌ Error deleting dog metrics: ${metricsError.message}`)
        } else {
          console.log('   ✅ Deleted dog metrics')
        }

        // Delete plan items
        const { error: planItemsError } = await supabase
          .from('plan_items')
          .delete()
          .eq('dog_id', dog.id)

        if (planItemsError) {
          console.error(`   ❌ Error deleting plan items: ${planItemsError.message}`)
        } else {
          console.log('   ✅ Deleted plan items')
        }

        // Delete plan-dog relationships
        const { error: planDogsError } = await supabase
          .from('plan_dogs')
          .delete()
          .eq('dog_id', dog.id)

        if (planDogsError) {
          console.error(`   ❌ Error deleting plan-dog relationships: ${planDogsError.message}`)
        } else {
          console.log('   ✅ Deleted plan-dog relationships')
        }
      }

      // Delete plans
      for (const plan of plans) {
        const { error: planError } = await supabase
          .from('plans')
          .delete()
          .eq('id', plan.id)

        if (planError) {
          console.error(`❌ Error deleting plan ${plan.id}: ${planError.message}`)
        } else {
          console.log(`✅ Deleted plan ${plan.id}`)
        }
      }

      // Delete subscriptions
      for (const subscription of subscriptions) {
        const { error: subError } = await supabase
          .from('subscriptions')
          .delete()
          .eq('id', subscription.id)

        if (subError) {
          console.error(`❌ Error deleting subscription ${subscription.id}: ${subError.message}`)
        } else {
          console.log(`✅ Deleted subscription ${subscription.id}`)
        }
      }

      // Delete dogs
      for (const dog of dogs) {
        const { error: dogError } = await supabase
          .from('dogs')
          .delete()
          .eq('id', dog.id)

        if (dogError) {
          console.error(`❌ Error deleting dog ${dog.name}: ${dogError.message}`)
        } else {
          console.log(`✅ Deleted dog ${dog.name}`)
        }
      }

      // Finally delete the user
      const { error: userError } = await supabase.auth.admin.deleteUser(user.id)

      if (userError) {
        console.error(`❌ Error deleting user: ${userError.message}`)
      } else {
        console.log(`✅ Deleted user ${user.email}`)
      }

      console.log('\n🎉 User deletion completed!')
    } else {
      console.log('\n✅ Safe mode: No data was actually deleted')
      console.log('   To perform actual deletion, set SAFE_MODE = false in the script')
    }

  } catch (error) {
    console.error('❌ Error in deletion script:', error)
  }
}

// Get user email from command line argument
const userEmail = process.argv[2]
if (!userEmail) {
  console.error('❌ Please provide a user email as an argument')
  console.log('Usage: node delete-user-with-cleanup.js <user-email>')
  process.exit(1)
}

deleteUserWithCleanup(userEmail)
