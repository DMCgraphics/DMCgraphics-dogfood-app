#!/usr/bin/env node

// Script to check auth.users and compare with dogs
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAuthUsers() {
  console.log('🔍 Checking auth.users vs dogs user_ids...\n')

  try {
    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return
    }

    console.log(`📊 Auth users: ${authUsers.users.length}`)
    authUsers.users.forEach(user => {
      console.log(`   - ${user.email} (ID: ${user.id})`)
    })

    // Get all dogs
    const { data: dogs, error: dogsError } = await supabase
      .from('dogs')
      .select('id, name, user_id')
      .order('created_at', { ascending: false })

    if (dogsError) {
      console.error('❌ Error fetching dogs:', dogsError)
      return
    }

    console.log(`\n📊 Dogs: ${dogs.length}`)
    dogs.forEach(dog => {
      console.log(`   - "${dog.name}" (User ID: ${dog.user_id || 'NULL'})`)
    })

    // Check for orphaned dogs (dogs with user_ids that don't exist in auth.users)
    const authUserIds = new Set(authUsers.users.map(u => u.id))
    const orphanedDogs = dogs.filter(dog => dog.user_id && !authUserIds.has(dog.user_id))

    console.log(`\n❌ Orphaned dogs (user_id not in auth.users): ${orphanedDogs.length}`)
    orphanedDogs.forEach(dog => {
      console.log(`   - "${dog.name}" (User ID: ${dog.user_id})`)
    })

    // Check for dogs with NULL user_id
    const dogsWithNullUserId = dogs.filter(dog => !dog.user_id)
    console.log(`\n❌ Dogs with NULL user_id: ${dogsWithNullUserId.length}`)
    dogsWithNullUserId.forEach(dog => {
      console.log(`   - "${dog.name}" (User ID: NULL)`)
    })

    // Check plans with NULL user_id and their associated dogs
    const { data: plansWithNullUserId, error: plansError } = await supabase
      .from('plans')
      .select('id, dog_id, status')
      .is('user_id', null)

    if (plansError) {
      console.error('❌ Error fetching plans with NULL user_id:', plansError)
      return
    }

    console.log(`\n❌ Plans with NULL user_id: ${plansWithNullUserId.length}`)
    for (const plan of plansWithNullUserId) {
      if (plan.dog_id) {
        const dog = dogs.find(d => d.id === plan.dog_id)
        if (dog) {
          const isOrphaned = dog.user_id && !authUserIds.has(dog.user_id)
          console.log(`   - Plan ${plan.id} (Status: ${plan.status}) -> Dog "${dog.name}" (User ID: ${dog.user_id || 'NULL'}) ${isOrphaned ? '[ORPHANED]' : ''}`)
        }
      }
    }

  } catch (error) {
    console.error('❌ Error in auth users check:', error)
  }
}

checkAuthUsers()
