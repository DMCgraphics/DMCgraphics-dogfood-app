#!/usr/bin/env node

/**
 * Test script to simulate dashboard loading and identify potential issues
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testDashboardLoading() {
  console.log('🔍 Testing dashboard loading for recent users...\n')

  try {
    // Get the most recently active user
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message)
      return
    }
    
    const recentUser = users.users
      .filter(user => user.last_sign_in_at)
      .sort((a, b) => new Date(b.last_sign_in_at).getTime() - new Date(a.last_sign_in_at).getTime())[0]
    
    if (!recentUser) {
      console.log('❌ No recent users found')
      return
    }
    
    console.log(`👤 Testing dashboard for: ${recentUser.email} (${recentUser.id})`)
    console.log(`   Last sign in: ${recentUser.last_sign_in_at}`)
    
    const userId = recentUser.id
    
    // Test all the queries that the dashboard makes
    console.log('\n📊 Testing dashboard queries...')
    
    const startTime = Date.now()
    
    // 1. Dogs query
    console.log('1. Testing dogs query...')
    const dogsStart = Date.now()
    const { data: dogsData, error: dogsError } = await supabase
      .from('dogs')
      .select(`
        *,
        dog_metrics (
          weight_kg,
          body_condition_score,
          measured_at,
          notes
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    const dogsTime = Date.now() - dogsStart
    if (dogsError) {
      console.error(`   ❌ Dogs query failed (${dogsTime}ms):`, dogsError.message)
    } else {
      console.log(`   ✅ Dogs query successful (${dogsTime}ms): ${dogsData.length} dogs`)
    }
    
    // 2. Plans query
    console.log('2. Testing plans query...')
    const plansStart = Date.now()
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select(`
        *,
        plan_items (
          *,
          recipes (name, macros)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    const plansTime = Date.now() - plansStart
    if (planError) {
      console.error(`   ❌ Plans query failed (${plansTime}ms):`, planError.message)
    } else {
      console.log(`   ✅ Plans query successful (${plansTime}ms): ${planData.length} plans`)
    }
    
    // 3. Subscriptions query
    console.log('3. Testing subscriptions query...')
    const subsStart = Date.now()
    const { data: subscriptionsData, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing', 'past_due'])
    
    const subsTime = Date.now() - subsStart
    if (subsError) {
      console.error(`   ❌ Subscriptions query failed (${subsTime}ms):`, subsError.message)
    } else {
      console.log(`   ✅ Subscriptions query successful (${subsTime}ms): ${subscriptionsData.length} active subscriptions`)
    }
    
    // 4. Active plans query
    console.log('4. Testing active plans query...')
    const activePlansStart = Date.now()
    const { data: activePlansData, error: activePlansError } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
    
    const activePlansTime = Date.now() - activePlansStart
    if (activePlansError) {
      console.error(`   ❌ Active plans query failed (${activePlansTime}ms):`, activePlansError.message)
    } else {
      console.log(`   ✅ Active plans query successful (${activePlansTime}ms): ${activePlansData.length} active plans`)
    }
    
    // 5. Orders query
    console.log('5. Testing orders query...')
    const ordersStart = Date.now()
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    const ordersTime = Date.now() - ordersStart
    if (ordersError) {
      console.error(`   ❌ Orders query failed (${ordersTime}ms):`, ordersError.message)
    } else {
      console.log(`   ✅ Orders query successful (${ordersTime}ms): ${ordersData.length} orders`)
    }
    
    const totalTime = Date.now() - startTime
    
    console.log('\n📊 Dashboard Loading Summary:')
    console.log(`   Total time: ${totalTime}ms`)
    console.log(`   Dogs: ${dogsData?.length || 0} (${dogsTime}ms)`)
    console.log(`   Plans: ${planData?.length || 0} (${plansTime}ms)`)
    console.log(`   Active Subscriptions: ${subscriptionsData?.length || 0} (${subsTime}ms)`)
    console.log(`   Active Plans: ${activePlansData?.length || 0} (${activePlansTime}ms)`)
    console.log(`   Orders: ${ordersData?.length || 0} (${ordersTime}ms)`)
    
    const hasErrors = dogsError || planError || subsError || activePlansError || ordersError
    if (hasErrors) {
      console.log('\n❌ Some queries failed - this could cause dashboard loading issues')
    } else {
      console.log('\n✅ All dashboard queries successful - loading should work fine')
    }
    
    // Check for potential performance issues
    const slowQueries = [
      { name: 'Dogs', time: dogsTime },
      { name: 'Plans', time: plansTime },
      { name: 'Subscriptions', time: subsTime },
      { name: 'Active Plans', time: activePlansTime },
      { name: 'Orders', time: ordersTime }
    ].filter(q => q.time > 2000) // Queries taking more than 2 seconds
    
    if (slowQueries.length > 0) {
      console.log('\n⚠️  Slow queries detected:')
      slowQueries.forEach(q => {
        console.log(`   - ${q.name}: ${q.time}ms`)
      })
    }
    
  } catch (error) {
    console.error('❌ Fatal error during dashboard test:', error)
  }
}

// Run the test
testDashboardLoading().catch(console.error)
