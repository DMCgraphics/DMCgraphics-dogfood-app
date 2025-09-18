#!/usr/bin/env node

// Script to check RPC functions
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRPCFunctions() {
  console.log('🔍 Checking RPC functions...\n')

  try {
    // Test the upsert_plan_dog RPC function
    console.log('1. Testing upsert_plan_dog RPC function...')
    const { data: rpcData, error: rpcError } = await supabase.rpc("upsert_plan_dog", {
      p_plan_id: '00000000-0000-0000-0000-000000000000',
      p_dog_id: '00000000-0000-0000-0000-000000000000',
      p_position: 1,
      p_snapshot: null,
      p_meals_per_day: 2,
      p_prescription: null,
      p_verify: false
    })

    if (rpcError) {
      console.error('❌ Error with upsert_plan_dog RPC:', rpcError)
    } else {
      console.log('✅ upsert_plan_dog RPC function works')
      console.log('Result:', rpcData)
    }

    // Test other RPC functions that might be used
    const rpcFunctions = [
      'recalculate_plan_totals',
      'set_plan_item_price',
      'calculate_plan_totals'
    ]

    console.log('\n2. Testing other RPC functions...')
    for (const funcName of rpcFunctions) {
      try {
        const { data, error } = await supabase.rpc(funcName, {})
        if (error) {
          console.log(`   ❌ ${funcName}: ${error.message}`)
        } else {
          console.log(`   ✅ ${funcName}: Works`)
        }
      } catch (err) {
        console.log(`   ❌ ${funcName}: ${err.message}`)
      }
    }

  } catch (error) {
    console.error('❌ Error in RPC check:', error)
  }
}

checkRPCFunctions()
