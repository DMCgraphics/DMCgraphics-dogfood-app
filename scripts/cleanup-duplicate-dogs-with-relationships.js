#!/usr/bin/env node

/**
 * Advanced cleanup script to remove duplicate dogs while handling database relationships
 * This script identifies duplicate dogs and merges their data before removing duplicates
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanupDuplicateDogsWithRelationships() {
  console.log('🐕 Starting Advanced Duplicate Dogs Cleanup...\n')

  try {
    // Step 1: Find all dogs grouped by user_id and name
    console.log('1. Finding duplicate dogs...')
    
    const { data: allDogs, error: allDogsError } = await supabase
      .from('dogs')
      .select('id, name, user_id, created_at, breed, age, weight, weight_unit, allergies, conditions')
      .order('created_at', { ascending: true })

    if (allDogsError) {
      console.error('❌ Error fetching dogs:', allDogsError)
      return
    }

    console.log(`   Found ${allDogs?.length || 0} total dogs`)

    // Step 2: Group dogs by user_id and name to find duplicates
    const dogGroups = {}
    const duplicates = []

    allDogs?.forEach(dog => {
      const key = `${dog.user_id}-${dog.name}`
      if (!dogGroups[key]) {
        dogGroups[key] = []
      }
      dogGroups[key].push(dog)
    })

    // Step 3: Identify duplicates (groups with more than 1 dog)
    Object.entries(dogGroups).forEach(([key, dogs]) => {
      if (dogs.length > 1) {
        console.log(`   🚨 Found ${dogs.length} duplicate dogs for user ${dogs[0].user_id}, name "${dogs[0].name}"`)
        duplicates.push({
          user_id: dogs[0].user_id,
          name: dogs[0].name,
          dogs: dogs
        })
      }
    })

    console.log(`   Found ${duplicates.length} sets of duplicate dogs`)

    if (duplicates.length === 0) {
      console.log('✅ No duplicate dogs found!')
      return
    }

    // Step 4: Display duplicate details
    console.log('\n2. Duplicate dogs details:')
    console.log('   ' + '='.repeat(80))
    duplicates.forEach((duplicate, index) => {
      console.log(`   ${index + 1}. User: ${duplicate.user_id}, Name: "${duplicate.name}"`)
      duplicate.dogs.forEach((dog, dogIndex) => {
        console.log(`      ${dogIndex + 1}. ID: ${dog.id}, Created: ${dog.created_at}`)
      })
      console.log('   ' + '-'.repeat(40))
    })

    // Step 5: Handle duplicates by updating references and then deleting
    console.log('\n3. Handling duplicates (updating references and merging data)...')
    
    let processedCount = 0
    let errorCount = 0

    for (const duplicate of duplicates) {
      // Keep the first dog (oldest due to ordering by created_at)
      const keepDog = duplicate.dogs[0]
      const deleteDogs = duplicate.dogs.slice(1)

      console.log(`   Keeping dog: ${keepDog.id} (created: ${keepDog.created_at})`)

      for (const dogToDelete of deleteDogs) {
        try {
          console.log(`   Processing dog: ${dogToDelete.id} (created: ${dogToDelete.created_at})`)
          
          // Step 5a: Update all plans that reference this dog to point to the keep dog
          console.log(`      Updating plans to reference dog ${keepDog.id} instead of ${dogToDelete.id}`)
          const { error: plansUpdateError } = await supabase
            .from('plans')
            .update({ dog_id: keepDog.id })
            .eq('dog_id', dogToDelete.id)

          if (plansUpdateError) {
            console.error(`      ❌ Failed to update plans:`, plansUpdateError.message)
            errorCount++
            continue
          }

          // Step 5b: Update plan_dogs table if it exists
          console.log(`      Updating plan_dogs to reference dog ${keepDog.id} instead of ${dogToDelete.id}`)
          const { error: planDogsUpdateError } = await supabase
            .from('plan_dogs')
            .update({ dog_id: keepDog.id })
            .eq('dog_id', dogToDelete.id)

          if (planDogsUpdateError && !planDogsUpdateError.message.includes('relation "plan_dogs" does not exist')) {
            console.error(`      ❌ Failed to update plan_dogs:`, planDogsUpdateError.message)
            // Don't count this as an error since the table might not exist
          }

          // Step 5c: Update any other tables that might reference dogs
          // Update dog_metrics if they exist
          const { error: metricsUpdateError } = await supabase
            .from('dog_metrics')
            .update({ dog_id: keepDog.id })
            .eq('dog_id', dogToDelete.id)

          if (metricsUpdateError && !metricsUpdateError.message.includes('relation "dog_metrics" does not exist')) {
            console.error(`      ❌ Failed to update dog_metrics:`, metricsUpdateError.message)
          }

          // Update weight_logs if they exist
          const { error: weightLogsUpdateError } = await supabase
            .from('weight_logs')
            .update({ dog_id: keepDog.id })
            .eq('dog_id', dogToDelete.id)

          if (weightLogsUpdateError && !weightLogsUpdateError.message.includes('relation "weight_logs" does not exist')) {
            console.error(`      ❌ Failed to update weight_logs:`, weightLogsUpdateError.message)
          }

          // Update stool_logs if they exist
          const { error: stoolLogsUpdateError } = await supabase
            .from('stool_logs')
            .update({ dog_id: keepDog.id })
            .eq('dog_id', dogToDelete.id)

          if (stoolLogsUpdateError && !stoolLogsUpdateError.message.includes('relation "stool_logs" does not exist')) {
            console.error(`      ❌ Failed to update stool_logs:`, stoolLogsUpdateError.message)
          }

          // Step 5d: Now delete the duplicate dog
          console.log(`      Deleting duplicate dog: ${dogToDelete.id}`)
          const { error: deleteError } = await supabase
            .from('dogs')
            .delete()
            .eq('id', dogToDelete.id)

          if (deleteError) {
            console.error(`      ❌ Failed to delete dog ${dogToDelete.id}:`, deleteError.message)
            errorCount++
          } else {
            console.log(`      ✅ Successfully deleted dog ${dogToDelete.id}`)
            processedCount++
          }

        } catch (err) {
          console.error(`   ❌ Error processing dog ${dogToDelete.id}:`, err.message)
          errorCount++
        }
      }
    }

    // Step 6: Summary
    console.log('\n4. Cleanup Summary:')
    console.log('   ' + '='.repeat(40))
    console.log(`   Duplicate groups found: ${duplicates.length}`)
    console.log(`   Dogs processed: ${processedCount}`)
    console.log(`   Errors: ${errorCount}`)
    
    if (processedCount > 0) {
      console.log('   ✅ Cleanup completed successfully!')
    } else {
      console.log('   ⚠️  No dogs were processed')
    }

    // Step 7: Verify cleanup
    console.log('\n5. Verifying cleanup...')
    const { data: remainingDogs, error: verifyError } = await supabase
      .from('dogs')
      .select('id, name, user_id')
      .order('created_at', { ascending: true })

    if (verifyError) {
      console.error('❌ Error verifying cleanup:', verifyError)
    } else {
      // Check for remaining duplicates
      const remainingGroups = {}
      remainingDogs?.forEach(dog => {
        const key = `${dog.user_id}-${dog.name}`
        if (!remainingGroups[key]) {
          remainingGroups[key] = []
        }
        remainingGroups[key].push(dog)
      })

      const remainingDuplicates = Object.entries(remainingGroups).filter(([key, dogs]) => dogs.length > 1)
      
      console.log(`   Remaining dogs: ${remainingDogs?.length || 0}`)
      console.log(`   Remaining duplicate groups: ${remainingDuplicates.length}`)
      
      if (remainingDuplicates.length === 0) {
        console.log('   ✅ No duplicate dogs remain!')
      } else {
        console.log('   ⚠️  Some duplicate dogs still exist')
        remainingDuplicates.forEach(([key, dogs]) => {
          console.log(`      - ${dogs[0].user_id}: "${dogs[0].name}" (${dogs.length} dogs)`)
        })
      }
    }

  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error)
  }
}

// Run the cleanup
cleanupDuplicateDogsWithRelationships().catch(console.error)
