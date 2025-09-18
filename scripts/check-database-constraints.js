#!/usr/bin/env node

// Script to check database foreign key constraints and cascade rules
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseConstraints() {
  console.log('🔍 Checking database foreign key constraints...\n')

  try {
    // Check current dogs and their user associations
    const { data: dogs, error: dogsError } = await supabase
      .from('dogs')
      .select(`
        id,
        name,
        user_id,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (dogsError) {
      console.error('❌ Error fetching dogs:', dogsError)
      return
    }

    console.log(`✅ Found ${dogs.length} dogs in database:`)
    dogs.forEach((dog, index) => {
      console.log(`   ${index + 1}. ${dog.name} (ID: ${dog.id}) - User: ${dog.user_id} - Created: ${dog.created_at}`)
    })

    // Check for orphaned dogs (dogs without valid users)
    console.log('\n🔍 Checking for orphaned dogs...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return
    }

    const validUserIds = new Set(authUsers.users.map(u => u.id))
    const orphanedDogs = dogs.filter(dog => !validUserIds.has(dog.user_id))

    if (orphanedDogs.length > 0) {
      console.log(`❌ Found ${orphanedDogs.length} orphaned dogs:`)
      orphanedDogs.forEach(dog => {
        console.log(`   - ${dog.name} (ID: ${dog.id}) - Orphaned User ID: ${dog.user_id}`)
      })
    } else {
      console.log('✅ No orphaned dogs found')
    }

    // Check for duplicate dogs (same name, same user)
    console.log('\n🔍 Checking for duplicate dogs...')
    const dogGroups = {}
    dogs.forEach(dog => {
      const key = `${dog.name}-${dog.user_id}`
      if (!dogGroups[key]) {
        dogGroups[key] = []
      }
      dogGroups[key].push(dog)
    })

    const duplicateGroups = Object.entries(dogGroups).filter(([key, group]) => group.length > 1)
    
    if (duplicateGroups.length > 0) {
      console.log(`❌ Found ${duplicateGroups.length} groups of duplicate dogs:`)
      duplicateGroups.forEach(([key, group]) => {
        console.log(`   - ${key}: ${group.length} duplicates`)
        group.forEach((dog, index) => {
          console.log(`     ${index + 1}. ID: ${dog.id} - Created: ${dog.created_at}`)
        })
      })
    } else {
      console.log('✅ No duplicate dogs found')
    }

    // Check related tables that might have foreign keys to dogs
    console.log('\n🔍 Checking related tables...')
    
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('id, user_id, dog_id, status')
      .limit(5)

    if (plansError) {
      console.error('❌ Error fetching plans:', plansError)
    } else {
      console.log(`✅ Found ${plans.length} plans (showing first 5):`)
      plans.forEach(plan => {
        console.log(`   - Plan ${plan.id}: User ${plan.user_id}, Dog ${plan.dog_id}, Status: ${plan.status}`)
      })
    }

    const { data: planItems, error: planItemsError } = await supabase
      .from('plan_items')
      .select('id, plan_id, dog_id')
      .limit(5)

    if (planItemsError) {
      console.error('❌ Error fetching plan items:', planItemsError)
    } else {
      console.log(`✅ Found ${plan_items.length} plan items (showing first 5):`)
      planItems.forEach(item => {
        console.log(`   - Item ${item.id}: Plan ${item.plan_id}, Dog ${item.dog_id}`)
      })
    }

  } catch (error) {
    console.error('❌ Error in constraint check:', error)
  }
}

checkDatabaseConstraints()
