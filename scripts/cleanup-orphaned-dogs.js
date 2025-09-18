#!/usr/bin/env node

// Script to clean up orphaned dogs and related records
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanupOrphanedDogs() {
  console.log('🧹 Cleaning up orphaned dogs and related records...\n')

  try {
    // 1. Get all valid user IDs from auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return
    }

    const validUserIds = new Set(authUsers.users.map(u => u.id))
    console.log(`✅ Found ${validUserIds.size} valid users`)

    // 2. Find orphaned dogs
    const { data: allDogs, error: dogsError } = await supabase
      .from('dogs')
      .select('*')

    if (dogsError) {
      console.error('❌ Error fetching dogs:', dogsError)
      return
    }

    const orphanedDogs = allDogs.filter(dog => !validUserIds.has(dog.user_id))
    console.log(`⚠️  Found ${orphanedDogs.length} orphaned dogs`)

    if (orphanedDogs.length === 0) {
      console.log('✅ No orphaned dogs to clean up')
      return
    }

    // 3. Show what will be deleted
    console.log('\n📋 Records to be deleted:')
    orphanedDogs.forEach(dog => {
      console.log(`   - Dog: ${dog.name} (ID: ${dog.id}) - User ID: ${dog.user_id}`)
    })

    // 4. Find related records
    const orphanedDogIds = orphanedDogs.map(dog => dog.id)
    
    // Check for plans
    const { data: orphanedPlans, error: plansError } = await supabase
      .from('plans')
      .select('id, user_id, dog_id, status')
      .in('dog_id', orphanedDogIds)

    if (plansError) {
      console.error('❌ Error fetching plans:', plansError)
      return
    }

    if (orphanedPlans.length > 0) {
      console.log(`\n   - Plans: ${orphanedPlans.length} plans`)
      orphanedPlans.forEach(plan => {
        console.log(`     * Plan ${plan.id} (Status: ${plan.status})`)
      })
    }

    // Check for plan items
    const { data: orphanedPlanItems, error: planItemsError } = await supabase
      .from('plan_items')
      .select('id, plan_id, dog_id')
      .in('dog_id', orphanedDogIds)

    if (planItemsError) {
      console.error('❌ Error fetching plan items:', planItemsError)
      return
    }

    if (orphanedPlanItems.length > 0) {
      console.log(`   - Plan Items: ${orphanedPlanItems.length} items`)
    }

    // Check for dog metrics
    const { data: orphanedMetrics, error: metricsError } = await supabase
      .from('dog_metrics')
      .select('id, dog_id')
      .in('dog_id', orphanedDogIds)

    if (metricsError) {
      console.error('❌ Error fetching dog metrics:', metricsError)
      return
    }

    if (orphanedMetrics.length > 0) {
      console.log(`   - Dog Metrics: ${orphanedMetrics.length} records`)
    }

    // Check for dog notes
    const { data: orphanedNotes, error: notesError } = await supabase
      .from('dog_notes')
      .select('id, dog_id')
      .in('dog_id', orphanedDogIds)

    if (notesError) {
      console.error('❌ Error fetching dog notes:', notesError)
      return
    }

    if (orphanedNotes.length > 0) {
      console.log(`   - Dog Notes: ${orphanedNotes.length} records`)
    }

    // 5. Perform the cleanup
    console.log('\n🗑️  Starting deletion...')

    // Delete in reverse dependency order
    if (orphanedNotes.length > 0) {
      const { error: deleteNotesError } = await supabase
        .from('dog_notes')
        .delete()
        .in('dog_id', orphanedDogIds)
      
      if (deleteNotesError) {
        console.error('❌ Error deleting dog notes:', deleteNotesError)
      } else {
        console.log('✅ Deleted dog notes')
      }
    }

    if (orphanedMetrics.length > 0) {
      const { error: deleteMetricsError } = await supabase
        .from('dog_metrics')
        .delete()
        .in('dog_id', orphanedDogIds)
      
      if (deleteMetricsError) {
        console.error('❌ Error deleting dog metrics:', deleteMetricsError)
      } else {
        console.log('✅ Deleted dog metrics')
      }
    }

    if (orphanedPlanItems.length > 0) {
      const { error: deletePlanItemsError } = await supabase
        .from('plan_items')
        .delete()
        .in('dog_id', orphanedDogIds)
      
      if (deletePlanItemsError) {
        console.error('❌ Error deleting plan items:', deletePlanItemsError)
      } else {
        console.log('✅ Deleted plan items')
      }
    }

    if (orphanedPlans.length > 0) {
      const { error: deletePlansError } = await supabase
        .from('plans')
        .delete()
        .in('dog_id', orphanedDogIds)
      
      if (deletePlansError) {
        console.error('❌ Error deleting plans:', deletePlansError)
      } else {
        console.log('✅ Deleted plans')
      }
    }

    // Finally delete the dogs
    const { error: deleteDogsError } = await supabase
      .from('dogs')
      .delete()
      .in('id', orphanedDogIds)
    
    if (deleteDogsError) {
      console.error('❌ Error deleting dogs:', deleteDogsError)
    } else {
      console.log('✅ Deleted orphaned dogs')
    }

    console.log('\n🎉 Cleanup completed!')

  } catch (error) {
    console.error('❌ Error in cleanup script:', error)
  }
}

cleanupOrphanedDogs()
