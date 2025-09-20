#!/usr/bin/env node

/**
 * Test script to verify CASCADE DELETE constraints are working
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testCascadeDelete() {
  console.log('🧪 Testing CASCADE DELETE constraints...\n')

  try {
    // Step 1: Create a test user
    console.log('1. Creating test user...')
    const testEmail = `test-${Date.now()}@example.com`
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: true
    })

    if (userError) {
      console.error('❌ Error creating test user:', userError.message)
      return
    }

    const testUserId = userData.user.id
    console.log(`✅ Created test user: ${testEmail} (ID: ${testUserId})`)

    // Step 2: Create test data
    console.log('\n2. Creating test data...')

    // Create a test dog
    const { data: dogData, error: dogError } = await supabase
      .from('dogs')
      .insert({
        user_id: testUserId,
        name: 'Test Dog',
        breed: 'Test Breed',
        age: 3,
        weight: 25,
        weight_unit: 'lb'
      })
      .select('id')
      .single()

    if (dogError) {
      console.error('❌ Error creating test dog:', dogError.message)
      await supabase.auth.admin.deleteUser(testUserId)
      return
    }

    const dogId = dogData.id
    console.log(`✅ Created test dog: ${dogId}`)

    // Create a test plan
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .insert({
        user_id: testUserId,
        dog_id: dogId,
        status: 'active',
        total_cents: 2500
      })
      .select('id')
      .single()

    if (planError) {
      console.error('❌ Error creating test plan:', planError.message)
      await supabase.auth.admin.deleteUser(testUserId)
      return
    }

    const planId = planData.id
    console.log(`✅ Created test plan: ${planId}`)

    // Create a test plan item
    const { data: planItemData, error: planItemError } = await supabase
      .from('plan_items')
      .insert({
        plan_id: planId,
        dog_id: dogId,
        recipe_id: '074fd394-7109-4339-8260-a77fff9950a1', // Use existing recipe
        qty: 1,
        unit_price_cents: 2500,
        amount_cents: 2500
      })
      .select('id')
      .single()

    if (planItemError) {
      console.error('❌ Error creating test plan item:', planItemError.message)
      await supabase.auth.admin.deleteUser(testUserId)
      return
    }

    const planItemId = planItemData.id
    console.log(`✅ Created test plan item: ${planItemId}`)

    // Create a test subscription
    const { data: subData, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: testUserId,
        plan_id: planId,
        stripe_subscription_id: `test_sub_${Date.now()}`,
        status: 'active'
      })
      .select('id')
      .single()

    if (subError) {
      console.error('❌ Error creating test subscription:', subError.message)
      await supabase.auth.admin.deleteUser(testUserId)
      return
    }

    const subId = subData.id
    console.log(`✅ Created test subscription: ${subId}`)

    // Create a test order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: testUserId,
        order_number: `TEST-${Date.now()}`,
        status: 'confirmed',
        total: 25.00
      })
      .select('id')
      .single()

    if (orderError) {
      console.error('❌ Error creating test order:', orderError.message)
      await supabase.auth.admin.deleteUser(testUserId)
      return
    }

    const orderId = orderData.id
    console.log(`✅ Created test order: ${orderId}`)

    // Step 3: Verify all data exists
    console.log('\n3. Verifying test data exists...')
    
    const { count: dogCount } = await supabase
      .from('dogs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', testUserId)

    const { count: planCount } = await supabase
      .from('plans')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', testUserId)

    const { count: planItemCount } = await supabase
      .from('plan_items')
      .select('*', { count: 'exact', head: true })
      .eq('plan_id', planId)

    const { count: subCount } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', testUserId)

    const { count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', testUserId)

    console.log(`   Dogs: ${dogCount}`)
    console.log(`   Plans: ${planCount}`)
    console.log(`   Plan Items: ${planItemCount}`)
    console.log(`   Subscriptions: ${subCount}`)
    console.log(`   Orders: ${orderCount}`)

    const totalRecords = dogCount + planCount + planItemCount + subCount + orderCount
    console.log(`   Total records: ${totalRecords}`)

    // Step 4: Test CASCADE DELETE by deleting the user
    console.log('\n4. Testing CASCADE DELETE by deleting user...')
    const { error: deleteError } = await supabase.auth.admin.deleteUser(testUserId)

    if (deleteError) {
      console.error('❌ Error deleting user:', deleteError.message)
      console.log('   This means CASCADE DELETE constraints are NOT working')
      
      // Clean up manually
      console.log('\n🧹 Cleaning up test data manually...')
      await supabase.from('plan_items').delete().eq('id', planItemId)
      await supabase.from('subscriptions').delete().eq('id', subId)
      await supabase.from('orders').delete().eq('id', orderId)
      await supabase.from('plans').delete().eq('id', planId)
      await supabase.from('dogs').delete().eq('id', dogId)
      await supabase.auth.admin.deleteUser(testUserId)
      console.log('✅ Manual cleanup completed')
    } else {
      console.log('✅ User deleted successfully!')
      
      // Step 5: Verify CASCADE DELETE worked
      console.log('\n5. Verifying CASCADE DELETE worked...')
      
      const { count: dogCountAfter } = await supabase
        .from('dogs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', testUserId)

      const { count: planCountAfter } = await supabase
        .from('plans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', testUserId)

      const { count: planItemCountAfter } = await supabase
        .from('plan_items')
        .select('*', { count: 'exact', head: true })
        .eq('plan_id', planId)

      const { count: subCountAfter } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', testUserId)

      const { count: orderCountAfter } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', testUserId)

      console.log(`   Dogs after deletion: ${dogCountAfter}`)
      console.log(`   Plans after deletion: ${planCountAfter}`)
      console.log(`   Plan Items after deletion: ${planItemCountAfter}`)
      console.log(`   Subscriptions after deletion: ${subCountAfter}`)
      console.log(`   Orders after deletion: ${orderCountAfter}`)

      const totalRecordsAfter = dogCountAfter + planCountAfter + planItemCountAfter + subCountAfter + orderCountAfter

      if (totalRecordsAfter === 0) {
        console.log('\n🎉 SUCCESS! CASCADE DELETE constraints are working correctly!')
        console.log('   All related data was automatically deleted when the user was deleted.')
      } else {
        console.log('\n❌ FAILURE! CASCADE DELETE constraints are NOT working correctly!')
        console.log(`   ${totalRecordsAfter} records still exist after user deletion.`)
      }
    }

  } catch (error) {
    console.error('❌ Fatal error during test:', error)
  }
}

// Run the test
testCascadeDelete().catch(console.error)
