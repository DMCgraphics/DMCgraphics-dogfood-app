#!/usr/bin/env node

// Script to clean up orphaned dogs and their associated plans
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanupOrphanedDogsAndPlans() {
  console.log('🧹 Cleaning up orphaned dogs and their associated plans...\n')

  try {
    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return
    }

    const authUserIds = new Set(authUsers.users.map(u => u.id))
    console.log(`📊 Valid auth user IDs: ${Array.from(authUserIds).join(', ')}`)

    // Get all dogs
    const { data: dogs, error: dogsError } = await supabase
      .from('dogs')
      .select('id, name, user_id')
      .order('created_at', { ascending: false })

    if (dogsError) {
      console.error('❌ Error fetching dogs:', dogsError)
      return
    }

    // Find orphaned dogs
    const orphanedDogs = dogs.filter(dog => dog.user_id && !authUserIds.has(dog.user_id))
    console.log(`\n❌ Found ${orphanedDogs.length} orphaned dogs:`)
    orphanedDogs.forEach(dog => {
      console.log(`   - "${dog.name}" (ID: ${dog.id}, User ID: ${dog.user_id})`)
    })

    if (orphanedDogs.length === 0) {
      console.log('✅ No orphaned dogs found')
      return
    }

    // Clean up each orphaned dog and its associated data
    for (const dog of orphanedDogs) {
      console.log(`\n🧹 Cleaning up dog "${dog.name}" (ID: ${dog.id})...`)

      // 1. Delete dog metrics
      const { error: metricsError } = await supabase
        .from('dog_metrics')
        .delete()
        .eq('dog_id', dog.id)

      if (metricsError) {
        console.log(`   ❌ Error deleting dog metrics: ${metricsError.message}`)
      } else {
        console.log(`   ✅ Deleted dog metrics`)
      }

      // 2. Delete plan items
      const { error: planItemsError } = await supabase
        .from('plan_items')
        .delete()
        .eq('dog_id', dog.id)

      if (planItemsError) {
        console.log(`   ❌ Error deleting plan items: ${planItemsError.message}`)
      } else {
        console.log(`   ✅ Deleted plan items`)
      }

      // 3. Delete plan-dog relationships
      const { error: planDogsError } = await supabase
        .from('plan_dogs')
        .delete()
        .eq('dog_id', dog.id)

      if (planDogsError) {
        console.log(`   ❌ Error deleting plan-dog relationships: ${planDogsError.message}`)
      } else {
        console.log(`   ✅ Deleted plan-dog relationships`)
      }

      // 4. Get plans associated with this dog
      const { data: associatedPlans, error: plansError } = await supabase
        .from('plans')
        .select('id, status')
        .eq('dog_id', dog.id)

      if (plansError) {
        console.log(`   ❌ Error fetching associated plans: ${plansError.message}`)
      } else {
        console.log(`   📋 Found ${associatedPlans.length} associated plans`)
        
        // 5. Delete associated plans
        for (const plan of associatedPlans) {
          const { error: planError } = await supabase
            .from('plans')
            .delete()
            .eq('id', plan.id)

          if (planError) {
            console.log(`   ❌ Error deleting plan ${plan.id}: ${planError.message}`)
          } else {
            console.log(`   ✅ Deleted plan ${plan.id} (Status: ${plan.status})`)
          }
        }
      }

      // 6. Finally, delete the dog
      const { error: dogError } = await supabase
        .from('dogs')
        .delete()
        .eq('id', dog.id)

      if (dogError) {
        console.log(`   ❌ Error deleting dog: ${dogError.message}`)
      } else {
        console.log(`   ✅ Deleted dog "${dog.name}"`)
      }
    }

    // Verify cleanup
    console.log('\n🔍 Verifying cleanup...')
    
    const { data: remainingDogs, error: remainingDogsError } = await supabase
      .from('dogs')
      .select('id, name, user_id')
      .order('created_at', { ascending: false })

    if (remainingDogsError) {
      console.error('❌ Error fetching remaining dogs:', remainingDogsError)
    } else {
      console.log(`📊 Remaining dogs: ${remainingDogs.length}`)
      remainingDogs.forEach(dog => {
        const isValid = dog.user_id && authUserIds.has(dog.user_id)
        console.log(`   ${isValid ? '✅' : '❌'} "${dog.name}" (User ID: ${dog.user_id || 'NULL'})`)
      })
    }

    const { data: remainingPlans, error: remainingPlansError } = await supabase
      .from('plans')
      .select('id, user_id, status')
      .order('created_at', { ascending: false })

    if (remainingPlansError) {
      console.error('❌ Error fetching remaining plans:', remainingPlansError)
    } else {
      console.log(`\n📊 Remaining plans: ${remainingPlans.length}`)
      remainingPlans.forEach(plan => {
        const hasValidUserId = plan.user_id && authUserIds.has(plan.user_id)
        console.log(`   ${hasValidUserId ? '✅' : '❌'} Plan ${plan.id} (User ID: ${plan.user_id || 'NULL'}, Status: ${plan.status})`)
      })
    }

  } catch (error) {
    console.error('❌ Error in cleanup script:', error)
  }
}

cleanupOrphanedDogsAndPlans()
