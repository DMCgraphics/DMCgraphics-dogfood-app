#!/usr/bin/env node

// Safe script to clean up duplicate dogs, handling database constraints
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanupDuplicateDogsSafe() {
  console.log('🧹 Safely cleaning up duplicate dogs...\n')

  try {
    // Get the user ID for dcohen@nouripet.net
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return
    }

    const user = authUsers.users.find(u => u.email === 'dcohen@nouripet.net')
    if (!user) {
      console.error('❌ User dcohen@nouripet.net not found')
      return
    }

    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`)

    // Get all dogs for this user
    const { data: userDogs, error: dogsError } = await supabase
      .from('dogs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (dogsError) {
      console.error('❌ Error fetching dogs:', dogsError)
      return
    }

    console.log(`\n📋 Found ${userDogs.length} dogs for ${user.email}:`)
    userDogs.forEach((dog, index) => {
      console.log(`   ${index + 1}. ${dog.name} (ID: ${dog.id}) - Created: ${dog.created_at}`)
    })

    // Group dogs by name
    const dogsByName = {}
    userDogs.forEach(dog => {
      if (!dogsByName[dog.name]) {
        dogsByName[dog.name] = []
      }
      dogsByName[dog.name].push(dog)
    })

    // Find duplicates
    const duplicates = Object.entries(dogsByName).filter(([name, dogs]) => dogs.length > 1)
    
    if (duplicates.length === 0) {
      console.log('\n✅ No duplicate dogs found')
      return
    }

    console.log(`\n⚠️  Found duplicates:`)
    duplicates.forEach(([name, dogs]) => {
      console.log(`   ${name}: ${dogs.length} copies`)
      dogs.forEach((dog, index) => {
        console.log(`     ${index + 1}. ID: ${dog.id} - Created: ${dog.created_at}`)
      })
    })

    // For each duplicate group, keep the most recent and mark others for deletion
    const dogsToDelete = []
    duplicates.forEach(([name, dogs]) => {
      // Sort by created_at descending (most recent first)
      const sortedDogs = dogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      // Keep the first (most recent), mark the rest for deletion
      dogsToDelete.push(...sortedDogs.slice(1))
    })

    if (dogsToDelete.length === 0) {
      console.log('\n✅ No dogs to delete')
      return
    }

    console.log(`\n🗑️  Will delete ${dogsToDelete.length} duplicate dogs:`)
    dogsToDelete.forEach(dog => {
      console.log(`   - ${dog.name} (ID: ${dog.id}) - Created: ${dog.created_at}`)
    })

    // Check for related records and handle constraints
    const dogIdsToDelete = dogsToDelete.map(dog => dog.id)
    
    // Check for plans and their status
    const { data: plansToCheck, error: plansError } = await supabase
      .from('plans')
      .select('id, dog_id, status, user_id')
      .in('dog_id', dogIdsToDelete)

    if (plansError) {
      console.error('❌ Error fetching plans:', plansError)
      return
    }

    if (plansToCheck.length > 0) {
      console.log(`\n📋 Found ${plansToCheck.length} plans associated with dogs to delete:`)
      plansToCheck.forEach(plan => {
        console.log(`   - Plan ${plan.id} (Dog ID: ${plan.dog_id}, Status: ${plan.status})`)
      })

      // Check for active subscriptions
      const { data: activeSubscriptions, error: subsError } = await supabase
        .from('subscriptions')
        .select('id, plan_id, status')
        .in('plan_id', plansToCheck.map(p => p.id))
        .in('status', ['active', 'trialing', 'past_due'])

      if (subsError) {
        console.error('❌ Error fetching subscriptions:', subsError)
        return
      }

      if (activeSubscriptions.length > 0) {
        console.log(`\n⚠️  Found ${activeSubscriptions.length} active subscriptions:`)
        activeSubscriptions.forEach(sub => {
          console.log(`   - Subscription ${sub.id} (Plan: ${sub.plan_id}, Status: ${sub.status})`)
        })
        console.log('\n❌ Cannot delete dogs with active subscriptions. Please cancel subscriptions first.')
        return
      }
    }

    // Check for other related records
    const { data: planItemsToDelete, error: planItemsError } = await supabase
      .from('plan_items')
      .select('id, plan_id, dog_id')
      .in('dog_id', dogIdsToDelete)

    if (planItemsError) {
      console.error('❌ Error fetching plan items:', planItemsError)
      return
    }

    const { data: metricsToDelete, error: metricsError } = await supabase
      .from('dog_metrics')
      .select('id, dog_id')
      .in('dog_id', dogIdsToDelete)

    if (metricsError) {
      console.error('❌ Error fetching dog metrics:', metricsError)
      return
    }

    console.log(`\n📊 Related records to delete:`)
    console.log(`   - Plan Items: ${planItemsToDelete.length}`)
    console.log(`   - Dog Metrics: ${metricsToDelete.length}`)
    console.log(`   - Plans: ${plansToCheck.length}`)

    // Perform safe deletion
    console.log('\n🗑️  Starting safe deletion...')

    // Delete in reverse dependency order
    if (metricsToDelete.length > 0) {
      const { error: deleteMetricsError } = await supabase
        .from('dog_metrics')
        .delete()
        .in('dog_id', dogIdsToDelete)
      
      if (deleteMetricsError) {
        console.error('❌ Error deleting dog metrics:', deleteMetricsError)
        return
      } else {
        console.log('✅ Deleted dog metrics')
      }
    }

    if (planItemsToDelete.length > 0) {
      const { error: deletePlanItemsError } = await supabase
        .from('plan_items')
        .delete()
        .in('dog_id', dogIdsToDelete)
      
      if (deletePlanItemsError) {
        console.error('❌ Error deleting plan items:', deletePlanItemsError)
        return
      } else {
        console.log('✅ Deleted plan items')
      }
    }

    if (plansToCheck.length > 0) {
      const { error: deletePlansError } = await supabase
        .from('plans')
        .delete()
        .in('dog_id', dogIdsToDelete)
      
      if (deletePlansError) {
        console.error('❌ Error deleting plans:', deletePlansError)
        return
      } else {
        console.log('✅ Deleted plans')
      }
    }

    // Finally delete the dogs
    const { error: deleteDogsError } = await supabase
      .from('dogs')
      .delete()
      .in('id', dogIdsToDelete)
    
    if (deleteDogsError) {
      console.error('❌ Error deleting dogs:', deleteDogsError)
    } else {
      console.log('✅ Deleted duplicate dogs')
    }

    console.log('\n🎉 Safe cleanup completed!')

  } catch (error) {
    console.error('❌ Error in cleanup script:', error)
  }
}

cleanupDuplicateDogsSafe()
