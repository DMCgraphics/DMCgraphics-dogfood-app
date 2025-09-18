#!/usr/bin/env node

// Script to check the plan_dogs table
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPlanDogsTable() {
  console.log('🔍 Checking plan_dogs table...\n')

  try {
    // Check if plan_dogs table exists
    const { data: planDogs, error } = await supabase
      .from('plan_dogs')
      .select('*')
      .limit(3)

    if (error) {
      console.error('❌ Error querying plan_dogs table:', error)
      return
    }

    console.log(`✅ plan_dogs table exists, found ${planDogs.length} records:`)
    planDogs.forEach((planDog, index) => {
      console.log(`   ${index + 1}. Plan: ${planDog.plan_id}, Dog: ${planDog.dog_id}, Position: ${planDog.position}`)
    })

    // Check the schema
    if (planDogs.length > 0) {
      console.log('\n✅ plan_dogs table schema:')
      console.log(JSON.stringify(planDogs[0], null, 2))
    }

  } catch (error) {
    console.error('❌ Error in plan_dogs check:', error)
  }
}

checkPlanDogsTable()
