#!/usr/bin/env node

/**
 * Verification script to check if user deletion constraints are working properly
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyUserDeletionConstraints() {
  console.log('🔍 Verifying User Deletion Constraints...\n')

  try {
    // Check if we can query the constraints
    console.log('1. Checking database constraints...')
    
    // Try to get constraint information
    const { data: constraints, error: constraintError } = await supabase
      .rpc('get_foreign_key_constraints')
      .limit(50)

    if (constraintError) {
      console.log('⚠️  Cannot query constraints directly:', constraintError.message)
      console.log('   This is normal - we\'ll test the constraints differently\n')
    } else {
      console.log('✅ Found constraints:', constraints.length)
      constraints.forEach(constraint => {
        console.log(`   - ${constraint.table_name}.${constraint.column_name} -> ${constraint.foreign_table_name}.${constraint.foreign_column_name} (${constraint.delete_rule})`)
      })
    }

    // Check current user data to see what we're working with
    console.log('\n2. Checking current user data...')
    
    const { data: users } = await supabase.auth.admin.listUsers()
    console.log(`   Total users in auth.users: ${users.users.length}`)
    
    // Check data in each table
    const tablesToCheck = [
      'dogs',
      'plans', 
      'subscriptions',
      'orders',
      'plan_items'
    ]
    
    for (const tableName of tablesToCheck) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (!error) {
          console.log(`   ${tableName}: ${count} total records`)
        } else {
          console.log(`   ${tableName}: Error - ${error.message}`)
        }
      } catch (tableError) {
        console.log(`   ${tableName}: Table doesn't exist or error - ${tableError.message}`)
      }
    }

    // Check for orphaned data
    console.log('\n3. Checking for orphaned data...')
    
    // Check for dogs without valid users
    const { data: orphanedDogs, error: orphanedDogsError } = await supabase
      .from('dogs')
      .select('id, name, user_id')
      .limit(10)

    if (!orphanedDogsError && orphanedDogs) {
      let orphanedCount = 0
      for (const dog of orphanedDogs) {
        if (dog.user_id) {
          const { data: user, error: userError } = await supabase.auth.admin.getUserById(dog.user_id)
          if (userError || !user) {
            orphanedCount++
            console.log(`   🚨 Orphaned dog: ${dog.name} (user_id: ${dog.user_id})`)
          }
        }
      }
      if (orphanedCount === 0) {
        console.log('   ✅ No orphaned dogs found')
      }
    }

    // Check for plans without valid users
    const { data: orphanedPlans, error: orphanedPlansError } = await supabase
      .from('plans')
      .select('id, user_id')
      .limit(10)

    if (!orphanedPlansError && orphanedPlans) {
      let orphanedCount = 0
      for (const plan of orphanedPlans) {
        if (plan.user_id) {
          const { data: user, error: userError } = await supabase.auth.admin.getUserById(plan.user_id)
          if (userError || !user) {
            orphanedCount++
            console.log(`   🚨 Orphaned plan: ${plan.id} (user_id: ${plan.user_id})`)
          }
        }
      }
      if (orphanedCount === 0) {
        console.log('   ✅ No orphaned plans found')
      }
    }

    // Test constraint behavior by creating a test scenario
    console.log('\n4. Testing constraint behavior...')
    
    // Create a test user
    const testEmail = `constraint-test-${Date.now()}@example.com`
    const { data: testUserData, error: testUserError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: true
    })

    if (testUserError) {
      console.log('❌ Error creating test user:', testUserError.message)
      return
    }

    const testUserId = testUserData.user.id
    console.log(`✅ Created test user: ${testEmail}`)

    // Create test data
    const { data: testDog, error: testDogError } = await supabase
      .from('dogs')
      .insert({
        user_id: testUserId,
        name: 'Constraint Test Dog',
        breed: 'Test Breed',
        age: 1,
        weight: 10,
        weight_unit: 'lb'
      })
      .select('id')
      .single()

    if (testDogError) {
      console.log('❌ Error creating test dog:', testDogError.message)
      await supabase.auth.admin.deleteUser(testUserId)
      return
    }

    const { data: testPlan, error: testPlanError } = await supabase
      .from('plans')
      .insert({
        user_id: testUserId,
        dog_id: testDog.id,
        status: 'active',
        total_cents: 1000
      })
      .select('id')
      .single()

    if (testPlanError) {
      console.log('❌ Error creating test plan:', testPlanError.message)
      await supabase.auth.admin.deleteUser(testUserId)
      return
    }

    console.log('✅ Created test data (dog + plan)')

    // Now test if deleting the user cascades properly
    console.log('\n5. Testing CASCADE DELETE...')
    
    const { error: deleteError } = await supabase.auth.admin.deleteUser(testUserId)
    
    if (deleteError) {
      console.log('❌ Error deleting test user:', deleteError.message)
      console.log('   This means CASCADE DELETE constraints are NOT working')
      
      // Clean up manually
      await supabase.from('plans').delete().eq('id', testPlan.id)
      await supabase.from('dogs').delete().eq('id', testDog.id)
      await supabase.auth.admin.deleteUser(testUserId)
      console.log('   Manual cleanup completed')
    } else {
      console.log('✅ Test user deleted successfully!')
      
      // Check if related data was also deleted
      const { data: remainingDog } = await supabase
        .from('dogs')
        .select('id')
        .eq('id', testDog.id)
        .single()

      const { data: remainingPlan } = await supabase
        .from('plans')
        .select('id')
        .eq('id', testPlan.id)
        .single()

      if (!remainingDog && !remainingPlan) {
        console.log('🎉 SUCCESS! CASCADE DELETE constraints are working!')
        console.log('   All related data was automatically deleted.')
      } else {
        console.log('❌ FAILURE! CASCADE DELETE constraints are NOT working!')
        console.log('   Some related data still exists after user deletion.')
      }
    }

    console.log('\n📊 Summary:')
    console.log('   If you see "SUCCESS!" above, user deletion should work in the Supabase Auth interface.')
    console.log('   If you see "FAILURE!", the constraints need to be fixed.')

  } catch (error) {
    console.error('❌ Fatal error during verification:', error)
  }
}

// Run the verification
verifyUserDeletionConstraints().catch(console.error)
