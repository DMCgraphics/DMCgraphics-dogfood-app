#!/usr/bin/env node

// Script to specifically handle the 3 Teddy dogs situation
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanupTeddyDogs() {
  console.log('🐕 Cleaning up Teddy dogs...\n')

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

    // Get all Teddy dogs for this user
    const { data: teddyDogs, error: dogsError } = await supabase
      .from('dogs')
      .select('*')
      .eq('user_id', user.id)
      .eq('name', 'Teddy')
      .order('created_at', { ascending: true })

    if (dogsError) {
      console.error('❌ Error fetching Teddy dogs:', dogsError)
      return
    }

    console.log(`\n📋 Found ${teddyDogs.length} Teddy dogs:`)
    teddyDogs.forEach((dog, index) => {
      console.log(`   ${index + 1}. ID: ${dog.id} - Created: ${dog.created_at}`)
    })

    // Check which Teddy has the active subscription
    console.log('\n🔍 Checking for active subscriptions...')
    
    for (const dog of teddyDogs) {
      const { data: plans, error: plansError } = await supabase
        .from('plans')
        .select('id, dog_id, status, created_at')
        .eq('dog_id', dog.id)

      if (plansError) {
        console.error(`❌ Error fetching plans for dog ${dog.id}:`, plansError)
        continue
      }

      if (plans.length > 0) {
        console.log(`\n   Dog ${dog.id} has ${plans.length} plan(s):`)
        for (const plan of plans) {
          console.log(`     - Plan ${plan.id} (Status: ${plan.status}, Created: ${plan.created_at})`)
          
          // Check for active subscriptions
          const { data: subscriptions, error: subsError } = await supabase
            .from('subscriptions')
            .select('id, plan_id, status, created_at')
            .eq('plan_id', plan.id)
            .in('status', ['active', 'trialing', 'past_due'])

          if (subsError) {
            console.error(`❌ Error fetching subscriptions for plan ${plan.id}:`, subsError)
            continue
          }

          if (subscriptions.length > 0) {
            console.log(`       ✅ ACTIVE SUBSCRIPTION: ${subscriptions[0].id} (Status: ${subscriptions[0].status})`)
          } else {
            console.log(`       ❌ No active subscription`)
          }
        }
      } else {
        console.log(`   Dog ${dog.id}: No plans found`)
      }
    }

    // Identify which Teddy to keep (the one with active subscription)
    let keepDogId = null
    let dogsToDelete = []

    for (const dog of teddyDogs) {
      const { data: plans } = await supabase
        .from('plans')
        .select('id')
        .eq('dog_id', dog.id)

      let hasActiveSubscription = false
      for (const plan of plans || []) {
        const { data: subscriptions } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('plan_id', plan.id)
          .in('status', ['active', 'trialing', 'past_due'])

        if (subscriptions && subscriptions.length > 0) {
          hasActiveSubscription = true
          break
        }
      }

      if (hasActiveSubscription) {
        keepDogId = dog.id
        console.log(`\n✅ KEEPING: Dog ${dog.id} (has active subscription)`)
      } else {
        dogsToDelete.push(dog)
        console.log(`\n🗑️  DELETING: Dog ${dog.id} (no active subscription)`)
      }
    }

    if (!keepDogId) {
      console.log('\n⚠️  No Teddy dog with active subscription found. Keeping the most recent one.')
      // Keep the most recent (last in the sorted array)
      keepDogId = teddyDogs[teddyDogs.length - 1].id
      dogsToDelete = teddyDogs.slice(0, -1)
    }

    if (dogsToDelete.length === 0) {
      console.log('\n✅ No duplicate Teddy dogs to delete')
      return
    }

    console.log(`\n🗑️  Will delete ${dogsToDelete.length} duplicate Teddy dogs:`)
    dogsToDelete.forEach(dog => {
      console.log(`   - ID: ${dog.id} - Created: ${dog.created_at}`)
    })

    // Delete the duplicate dogs and their related records
    const dogIdsToDelete = dogsToDelete.map(dog => dog.id)

    console.log('\n🗑️  Starting deletion...')

    // Delete related records first
    const { error: deleteMetricsError } = await supabase
      .from('dog_metrics')
      .delete()
      .in('dog_id', dogIdsToDelete)

    if (deleteMetricsError) {
      console.error('❌ Error deleting dog metrics:', deleteMetricsError)
    } else {
      console.log('✅ Deleted dog metrics')
    }

    const { error: deletePlanItemsError } = await supabase
      .from('plan_items')
      .delete()
      .in('dog_id', dogIdsToDelete)

    if (deletePlanItemsError) {
      console.error('❌ Error deleting plan items:', deletePlanItemsError)
    } else {
      console.log('✅ Deleted plan items')
    }

    const { error: deletePlansError } = await supabase
      .from('plans')
      .delete()
      .in('dog_id', dogIdsToDelete)

    if (deletePlansError) {
      console.error('❌ Error deleting plans:', deletePlansError)
    } else {
      console.log('✅ Deleted plans')
    }

    // Finally delete the dogs
    const { error: deleteDogsError } = await supabase
      .from('dogs')
      .delete()
      .in('id', dogIdsToDelete)

    if (deleteDogsError) {
      console.error('❌ Error deleting dogs:', deleteDogsError)
    } else {
      console.log('✅ Deleted duplicate Teddy dogs')
    }

    console.log(`\n🎉 Cleanup completed! Kept Teddy dog: ${keepDogId}`)

  } catch (error) {
    console.error('❌ Error in cleanup script:', error)
  }
}

cleanupTeddyDogs()
