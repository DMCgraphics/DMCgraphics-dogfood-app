#!/usr/bin/env node

// Debug script to check user-dog associations and identify orphaned records
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugUserDogs() {
  console.log('🔍 Debugging User-Dog Associations...\n')

  try {
    // 1. Check all users in auth.users
    console.log('1. Checking auth.users...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return
    }

    console.log(`✅ Found ${authUsers.users.length} users in auth:`)
    authUsers.users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (ID: ${user.id}) - Created: ${user.created_at}`)
    })

    // 2. Check all dogs in the database
    console.log('\n2. Checking all dogs in database...')
    const { data: allDogs, error: dogsError } = await supabase
      .from('dogs')
      .select('*')
      .order('created_at', { ascending: false })

    if (dogsError) {
      console.error('❌ Error fetching dogs:', dogsError)
      return
    }

    console.log(`✅ Found ${allDogs.length} dogs in database:`)
    allDogs.forEach((dog, index) => {
      console.log(`   ${index + 1}. ${dog.name} (ID: ${dog.id}) - User ID: ${dog.user_id} - Created: ${dog.created_at}`)
    })

    // 3. Check for orphaned dogs (dogs without valid users)
    console.log('\n3. Checking for orphaned dogs...')
    const validUserIds = new Set(authUsers.users.map(u => u.id))
    const orphanedDogs = allDogs.filter(dog => !validUserIds.has(dog.user_id))

    if (orphanedDogs.length > 0) {
      console.log(`⚠️  Found ${orphanedDogs.length} orphaned dogs:`)
      orphanedDogs.forEach(dog => {
        console.log(`   - ${dog.name} (ID: ${dog.id}) - Orphaned User ID: ${dog.user_id}`)
      })
    } else {
      console.log('✅ No orphaned dogs found')
    }

    // 4. Check for duplicate user IDs
    console.log('\n4. Checking for duplicate user IDs...')
    const userDogCounts = {}
    allDogs.forEach(dog => {
      userDogCounts[dog.user_id] = (userDogCounts[dog.user_id] || 0) + 1
    })

    Object.entries(userDogCounts).forEach(([userId, count]) => {
      const user = authUsers.users.find(u => u.id === userId)
      const userEmail = user ? user.email : 'Unknown/Orphaned'
      console.log(`   User ${userEmail} (${userId}): ${count} dogs`)
    })

    // 5. Check recent activity
    console.log('\n5. Recent activity (last 24 hours)...')
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: recentDogs, error: recentError } = await supabase
      .from('dogs')
      .select('*')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })

    if (recentError) {
      console.error('❌ Error fetching recent dogs:', recentError)
    } else {
      console.log(`✅ Found ${recentDogs.length} dogs created in last 24 hours:`)
      recentDogs.forEach(dog => {
        const user = authUsers.users.find(u => u.id === dog.user_id)
        const userEmail = user ? user.email : 'Unknown/Orphaned'
        console.log(`   - ${dog.name} (ID: ${dog.id}) - User: ${userEmail} - Created: ${dog.created_at}`)
      })
    }

    // 6. Check plans associated with dogs
    console.log('\n6. Checking plans associated with dogs...')
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('id, user_id, dog_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (plansError) {
      console.error('❌ Error fetching plans:', plansError)
    } else {
      console.log(`✅ Found ${plans.length} recent plans:`)
      plans.forEach(plan => {
        const user = authUsers.users.find(u => u.id === plan.user_id)
        const userEmail = user ? user.email : 'Unknown/Orphaned'
        const dog = allDogs.find(d => d.id === plan.dog_id)
        const dogName = dog ? dog.name : 'Unknown'
        console.log(`   - Plan ${plan.id} - User: ${userEmail} - Dog: ${dogName} - Status: ${plan.status}`)
      })
    }

  } catch (error) {
    console.error('❌ Error in debug script:', error)
  }
}

debugUserDogs()
