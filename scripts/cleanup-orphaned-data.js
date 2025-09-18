#!/usr/bin/env node

// Script to clean up orphaned dogs and related data when users are deleted
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanupOrphanedData() {
  console.log('🧹 Cleaning up orphaned data...\n')

  try {
    // Get all dogs
    const { data: dogs, error: dogsError } = await supabase
      .from('dogs')
      .select('id, name, user_id, created_at')
      .order('created_at', { ascending: false })

    if (dogsError) {
      console.error('❌ Error fetching dogs:', dogsError)
      return
    }

    // Get all valid users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return
    }

    const validUserIds = new Set(authUsers.users.map(u => u.id))
    const orphanedDogs = dogs.filter(dog => !validUserIds.has(dog.user_id))

    console.log(`✅ Found ${dogs.length} total dogs`)
    console.log(`❌ Found ${orphanedDogs.length} orphaned dogs`)

    if (orphanedDogs.length === 0) {
      console.log('✅ No orphaned dogs to clean up')
      return
    }

    console.log('\n🗑️  Cleaning up orphaned dogs and related data...')

    for (const dog of orphanedDogs) {
      console.log(`\n🧹 Cleaning up dog: ${dog.name} (ID: ${dog.id})`)

      // 1. Delete dog metrics
      const { error: metricsError } = await supabase
        .from('dog_metrics')
        .delete()
        .eq('dog_id', dog.id)

      if (metricsError) {
        console.error(`   ❌ Error deleting dog metrics: ${metricsError.message}`)
      } else {
        console.log('   ✅ Deleted dog metrics')
      }

      // 2. Delete plan items
      const { error: planItemsError } = await supabase
        .from('plan_items')
        .delete()
        .eq('dog_id', dog.id)

      if (planItemsError) {
        console.error(`   ❌ Error deleting plan items: ${planItemsError.message}`)
      } else {
        console.log('   ✅ Deleted plan items')
      }

      // 3. Delete plan-dog relationships
      const { error: planDogsError } = await supabase
        .from('plan_dogs')
        .delete()
        .eq('dog_id', dog.id)

      if (planDogsError) {
        console.error(`   ❌ Error deleting plan-dog relationships: ${planDogsError.message}`)
      } else {
        console.log('   ✅ Deleted plan-dog relationships')
      }

      // 4. Delete plans that are only linked to this dog
      const { data: plans, error: plansError } = await supabase
        .from('plans')
        .select('id')
        .eq('dog_id', dog.id)

      if (plansError) {
        console.error(`   ❌ Error fetching plans: ${plansError.message}`)
      } else if (plans && plans.length > 0) {
        for (const plan of plans) {
          const { error: deletePlanError } = await supabase
            .from('plans')
            .delete()
            .eq('id', plan.id)

          if (deletePlanError) {
            console.error(`   ❌ Error deleting plan ${plan.id}: ${deletePlanError.message}`)
          } else {
            console.log(`   ✅ Deleted plan ${plan.id}`)
          }
        }
      }

      // 5. Finally delete the dog
      const { error: dogError } = await supabase
        .from('dogs')
        .delete()
        .eq('id', dog.id)

      if (dogError) {
        console.error(`   ❌ Error deleting dog: ${dogError.message}`)
      } else {
        console.log(`   ✅ Deleted dog ${dog.name}`)
      }
    }

    console.log('\n🎉 Orphaned data cleanup completed!')

    // Show remaining dogs
    const { data: remainingDogs, error: remainingError } = await supabase
      .from('dogs')
      .select('id, name, user_id')
      .order('created_at', { ascending: false })

    if (remainingError) {
      console.error('❌ Error fetching remaining dogs:', remainingError)
    } else {
      console.log(`\n📊 Remaining dogs: ${remainingDogs.length}`)
      remainingDogs.forEach((dog, index) => {
        console.log(`   ${index + 1}. ${dog.name} (User: ${dog.user_id})`)
      })
    }

  } catch (error) {
    console.error('❌ Error in cleanup script:', error)
  }
}

cleanupOrphanedData()
