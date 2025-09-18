#!/usr/bin/env node

// Script to check the plan_items table schema
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPlanItemsSchema() {
  console.log('🔍 Checking plan_items table schema...\n')

  try {
    // Get a sample plan item to see the schema
    const { data: samplePlanItem, error } = await supabase
      .from('plan_items')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      console.error('❌ Error fetching sample plan item:', error)
      return
    }

    console.log('✅ Sample plan item structure:')
    console.log(JSON.stringify(samplePlanItem, null, 2))

    // Try to insert a test plan item to see what columns are available
    console.log('\n🧪 Testing plan item insertion...')
    const testPlanItem = {
      plan_id: '00000000-0000-0000-0000-000000000000',
      dog_id: '00000000-0000-0000-0000-000000000000',
      recipe_id: '00000000-0000-0000-0000-000000000000',
      qty: 1,
      size_g: 400,
      billing_interval: 'week',
      stripe_price_id: 'price_test',
      unit_price_cents: 2100,
      amount_cents: 2100,
      meta: {
        source: 'test',
        dog_weight: 20,
        weight_unit: 'lb'
      }
    }

    const { data: insertData, error: insertError } = await supabase
      .from('plan_items')
      .insert(testPlanItem)
      .select('*')

    if (insertError) {
      console.error('❌ Error inserting test plan item:', insertError)
    } else {
      console.log('✅ Test plan item inserted successfully:')
      console.log(JSON.stringify(insertData[0], null, 2))
      
      // Clean up the test plan item
      await supabase
        .from('plan_items')
        .delete()
        .eq('id', insertData[0].id)
      console.log('✅ Test plan item cleaned up')
    }

  } catch (error) {
    console.error('❌ Error in schema check:', error)
  }
}

checkPlanItemsSchema()
