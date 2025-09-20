#!/usr/bin/env node

/**
 * Cleanup script to remove duplicate plans from the database
 * This script identifies and removes duplicate plans while preserving the one with an active subscription
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanupDuplicatePlans() {
  console.log('📋 Starting Duplicate Plans Cleanup...\n')

  try {
    // Step 1: Find all plans grouped by user_id and dog_id
    console.log('1. Finding duplicate plans...')
    
    const { data: allPlans, error: allPlansError } = await supabase
      .from('plans')
      .select('id, user_id, dog_id, status, created_at, updated_at')
      .order('created_at', { ascending: true })

    if (allPlansError) {
      console.error('❌ Error fetching plans:', allPlansError)
      return
    }

    console.log(`   Found ${allPlans?.length || 0} total plans`)

    // Step 2: Group plans by user_id and dog_id to find duplicates
    const planGroups = {}
    const duplicates = []

    allPlans?.forEach(plan => {
      const key = `${plan.user_id}-${plan.dog_id}`
      if (!planGroups[key]) {
        planGroups[key] = []
      }
      planGroups[key].push(plan)
    })

    // Step 3: Identify duplicates (groups with more than 1 plan)
    Object.entries(planGroups).forEach(([key, plans]) => {
      if (plans.length > 1) {
        console.log(`   🚨 Found ${plans.length} duplicate plans for user ${plans[0].user_id}, dog ${plans[0].dog_id}`)
        duplicates.push({
          user_id: plans[0].user_id,
          dog_id: plans[0].dog_id,
          plans: plans
        })
      }
    })

    console.log(`   Found ${duplicates.length} sets of duplicate plans`)

    if (duplicates.length === 0) {
      console.log('✅ No duplicate plans found!')
      return
    }

    // Step 4: Display duplicate details
    console.log('\n2. Duplicate plans details:')
    console.log('   ' + '='.repeat(80))
    duplicates.forEach((duplicate, index) => {
      console.log(`   ${index + 1}. User: ${duplicate.user_id}, Dog: ${duplicate.dog_id}`)
      duplicate.plans.forEach((plan, planIndex) => {
        console.log(`      ${planIndex + 1}. ID: ${plan.id}, Status: ${plan.status}, Created: ${plan.created_at}`)
      })
      console.log('   ' + '-'.repeat(40))
    })

    // Step 5: Handle duplicates by keeping the one with active subscription
    console.log('\n3. Handling duplicates (keeping plan with active subscription)...')
    
    let processedCount = 0
    let errorCount = 0

    for (const duplicate of duplicates) {
      // Check which plan has an active subscription
      const { data: subscriptions, error: subsError } = await supabase
        .from('subscriptions')
        .select('plan_id, status')
        .eq('user_id', duplicate.user_id)
        .in('status', ['active', 'trialing', 'past_due'])

      if (subsError) {
        console.error(`   ❌ Error fetching subscriptions:`, subsError.message)
        errorCount++
        continue
      }

      const activeSubscriptionPlanIds = subscriptions?.map(sub => sub.plan_id) || []
      console.log(`   Active subscription plan IDs: ${activeSubscriptionPlanIds.join(', ')}`)

      // Find the plan to keep (prefer one with active subscription, otherwise keep the oldest)
      let keepPlan = null
      let deletePlans = []

      // First, try to find a plan with an active subscription
      for (const plan of duplicate.plans) {
        if (activeSubscriptionPlanIds.includes(plan.id)) {
          keepPlan = plan
          deletePlans = duplicate.plans.filter(p => p.id !== plan.id)
          console.log(`   ✅ Keeping plan with active subscription: ${plan.id}`)
          break
        }
      }

      // If no plan has an active subscription, keep the oldest one
      if (!keepPlan) {
        keepPlan = duplicate.plans[0] // Oldest due to ordering
        deletePlans = duplicate.plans.slice(1)
        console.log(`   ⚠️ No active subscription found, keeping oldest plan: ${keepPlan.id}`)
      }

      // Delete the duplicate plans
      for (const planToDelete of deletePlans) {
        try {
          console.log(`   Deleting duplicate plan: ${planToDelete.id} (status: ${planToDelete.status})`)
          
          // First, delete plan_items associated with this plan
          const { error: planItemsError } = await supabase
            .from('plan_items')
            .delete()
            .eq('plan_id', planToDelete.id)

          if (planItemsError) {
            console.error(`   ❌ Failed to delete plan_items for plan ${planToDelete.id}:`, planItemsError.message)
            errorCount++
            continue
          }

          // Then delete the plan itself
          const { error: deleteError } = await supabase
            .from('plans')
            .delete()
            .eq('id', planToDelete.id)

          if (deleteError) {
            console.error(`   ❌ Failed to delete plan ${planToDelete.id}:`, deleteError.message)
            errorCount++
          } else {
            console.log(`   ✅ Successfully deleted plan ${planToDelete.id}`)
            processedCount++
          }

        } catch (err) {
          console.error(`   ❌ Error processing plan ${planToDelete.id}:`, err.message)
          errorCount++
        }
      }
    }

    // Step 6: Summary
    console.log('\n4. Cleanup Summary:')
    console.log('   ' + '='.repeat(40))
    console.log(`   Duplicate groups found: ${duplicates.length}`)
    console.log(`   Plans processed: ${processedCount}`)
    console.log(`   Errors: ${errorCount}`)
    
    if (processedCount > 0) {
      console.log('   ✅ Cleanup completed successfully!')
    } else {
      console.log('   ⚠️  No plans were processed')
    }

    // Step 7: Verify cleanup
    console.log('\n5. Verifying cleanup...')
    const { data: remainingPlans, error: verifyError } = await supabase
      .from('plans')
      .select('id, user_id, dog_id, status')
      .order('created_at', { ascending: true })

    if (verifyError) {
      console.error('❌ Error verifying cleanup:', verifyError)
    } else {
      // Check for remaining duplicates
      const remainingGroups = {}
      remainingPlans?.forEach(plan => {
        const key = `${plan.user_id}-${plan.dog_id}`
        if (!remainingGroups[key]) {
          remainingGroups[key] = []
        }
        remainingGroups[key].push(plan)
      })

      const remainingDuplicates = Object.entries(remainingGroups).filter(([key, plans]) => plans.length > 1)
      
      console.log(`   Remaining plans: ${remainingPlans?.length || 0}`)
      console.log(`   Remaining duplicate groups: ${remainingDuplicates.length}`)
      
      if (remainingDuplicates.length === 0) {
        console.log('   ✅ No duplicate plans remain!')
      } else {
        console.log('   ⚠️  Some duplicate plans still exist')
        remainingDuplicates.forEach(([key, plans]) => {
          console.log(`      - ${plans[0].user_id}: dog ${plans[0].dog_id} (${plans.length} plans)`)
        })
      }
    }

  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error)
  }
}

// Run the cleanup
cleanupDuplicatePlans().catch(console.error)
