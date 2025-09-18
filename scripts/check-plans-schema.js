#!/usr/bin/env node

// Script to check the plans table schema
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPlansSchema() {
  console.log('🔍 Checking plans table schema...\n')

  try {
    // Get a sample plan to see the schema
    const { data: samplePlan, error } = await supabase
      .from('plans')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      console.error('❌ Error fetching sample plan:', error)
      return
    }

    console.log('✅ Sample plan structure:')
    console.log(JSON.stringify(samplePlan, null, 2))

    // Try to insert a simple plan to see what columns are available
    console.log('\n🧪 Testing plan insertion...')
    const testPlan = {
      user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      status: 'draft',
      total_cents: 2100
    }

    const { data: insertData, error: insertError } = await supabase
      .from('plans')
      .insert(testPlan)
      .select('*')

    if (insertError) {
      console.error('❌ Error inserting test plan:', insertError)
    } else {
      console.log('✅ Test plan inserted successfully:')
      console.log(JSON.stringify(insertData[0], null, 2))
      
      // Clean up the test plan
      await supabase
        .from('plans')
        .delete()
        .eq('id', insertData[0].id)
      console.log('✅ Test plan cleaned up')
    }

  } catch (error) {
    console.error('❌ Error in schema check:', error)
  }
}

checkPlansSchema()
