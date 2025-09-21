#!/usr/bin/env node

/**
 * Test user deletion after removing blocking constraints
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testUserDeletionAfterConstraintRemoval() {
  console.log('🧪 Testing user deletion after constraint removal...\n')

  try {
    // Get all current users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message)
      return
    }
    
    console.log(`Found ${users.users.length} users:`)
    users.users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (ID: ${user.id})`)
    })
    
    if (users.users.length === 0) {
      console.log('\n📝 No users found to test deletion')
      return
    }
    
    // Test deletion on the first user
    const testUser = users.users[0]
    console.log(`\n🎯 Testing deletion for: ${testUser.email}`)
    
    // Check what data this user has
    console.log('\n📊 Checking user data...')
    
    const { data: userDogs } = await supabase.from('dogs').select('id, name').eq('user_id', testUser.id)
    const { data: userPlans } = await supabase.from('plans').select('id, status').eq('user_id', testUser.id)
    const { data: userSubs } = await supabase.from('subscriptions').select('id, status').eq('user_id', testUser.id)
    const { data: userOrders } = await supabase.from('orders').select('id, status').eq('user_id', testUser.id)
    
    console.log(`   Dogs: ${userDogs?.length || 0}`)
    console.log(`   Plans: ${userPlans?.length || 0}`)
    console.log(`   Subscriptions: ${userSubs?.length || 0}`)
    console.log(`   Orders: ${userOrders?.length || 0}`)
    
    if (userDogs && userDogs.length > 0) {
      console.log('   Dog details:')
      userDogs.forEach(dog => console.log(`     - ${dog.name} (ID: ${dog.id})`))
    }
    
    if (userPlans && userPlans.length > 0) {
      console.log('   Plan details:')
      userPlans.forEach(plan => console.log(`     - Plan ${plan.id} (Status: ${plan.status})`))
    }
    
    // Now test if we can delete the user directly
    console.log('\n🗑️  Testing direct user deletion...')
    const { error: deleteError } = await supabase.auth.admin.deleteUser(testUser.id)
    
    if (deleteError) {
      console.log('❌ FAILED: Error deleting user:', deleteError.message)
      console.log('   Error code:', deleteError.code)
      console.log('   Error status:', deleteError.status)
      console.log('   Full error:', JSON.stringify(deleteError, null, 2))
      
      console.log('\n💡 The constraints may still be blocking deletion.')
      console.log('   Try running the constraint removal script again.')
    } else {
      console.log('✅ SUCCESS: User deleted successfully!')
      
      // Check if related data was also deleted
      const { data: afterDogs } = await supabase.from('dogs').select('id').eq('user_id', testUser.id)
      const { data: afterPlans } = await supabase.from('plans').select('id').eq('user_id', testUser.id)
      const { data: afterSubs } = await supabase.from('subscriptions').select('id').eq('user_id', testUser.id)
      const { data: afterOrders } = await supabase.from('orders').select('id').eq('user_id', testUser.id)
      
      console.log('\n📊 After deletion:')
      console.log(`   Dogs: ${afterDogs?.length || 0}`)
      console.log(`   Plans: ${afterPlans?.length || 0}`)
      console.log(`   Subscriptions: ${afterSubs?.length || 0}`)
      console.log(`   Orders: ${afterOrders?.length || 0}`)
      
      if (afterDogs?.length === 0 && afterPlans?.length === 0 && afterSubs?.length === 0 && afterOrders?.length === 0) {
        console.log('\n🎉 PERFECT! All related data was automatically deleted!')
        console.log('   The Supabase Auth interface should now work for user deletion.')
      } else {
        console.log('\n⚠️  Some data remains after deletion:')
        if (afterDogs?.length > 0) console.log('   - Dogs still exist')
        if (afterPlans?.length > 0) console.log('   - Plans still exist')
        if (afterSubs?.length > 0) console.log('   - Subscriptions still exist')
        if (afterOrders?.length > 0) console.log('   - Orders still exist')
        console.log('   This suggests CASCADE DELETE is not working properly.')
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal error during test:', error)
  }
}

// Run the test
testUserDeletionAfterConstraintRemoval().catch(console.error)
