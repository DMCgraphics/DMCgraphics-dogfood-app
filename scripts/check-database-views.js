#!/usr/bin/env node

// Script to check database views
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseViews() {
  console.log('🔍 Checking database views...\n')

  try {
    // Try to query the checkout lines view directly
    console.log('1. Testing current_user_checkout_lines view...')
    const { data: checkoutLines, error: checkoutError } = await supabase
      .from('current_user_checkout_lines')
      .select('*')
      .limit(5)

    if (checkoutError) {
      console.error('❌ Error with current_user_checkout_lines:', checkoutError)
    } else {
      console.log(`✅ current_user_checkout_lines view works, found ${checkoutLines.length} records`)
      if (checkoutLines.length > 0) {
        console.log('Sample record:', JSON.stringify(checkoutLines[0], null, 2))
      }
    }

    // Try to query other potential views
    const viewsToTest = [
      'checkout_lines',
      'user_checkout_lines', 
      'plan_checkout_lines',
      'current_user_plans',
      'user_plans'
    ]

    console.log('\n2. Testing other potential views...')
    for (const viewName of viewsToTest) {
      try {
        const { data, error } = await supabase
          .from(viewName)
          .select('*')
          .limit(1)

        if (error) {
          console.log(`   ❌ ${viewName}: ${error.message}`)
        } else {
          console.log(`   ✅ ${viewName}: Found ${data.length} records`)
        }
      } catch (err) {
        console.log(`   ❌ ${viewName}: ${err.message}`)
      }
    }

    // Check if we can query plans and plan_items directly
    console.log('\n3. Testing direct table queries...')
    
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .limit(3)

    if (plansError) {
      console.error('❌ Error querying plans:', plansError)
    } else {
      console.log(`✅ Plans table: Found ${plans.length} records`)
    }

    const { data: planItems, error: planItemsError } = await supabase
      .from('plan_items')
      .select('*')
      .limit(3)

    if (planItemsError) {
      console.error('❌ Error querying plan_items:', planItemsError)
    } else {
      console.log(`✅ Plan_items table: Found ${planItems.length} records`)
    }

    // Try to manually construct what the checkout lines should look like
    console.log('\n4. Manually constructing checkout data...')
    const { data: manualCheckout, error: manualError } = await supabase
      .from('plans')
      .select(`
        id as plan_id,
        total_cents,
        plan_items (
          id,
          recipe_id,
          qty,
          unit_price_cents,
          amount_cents,
          billing_interval,
          stripe_price_id,
          recipes (name, slug)
        )
      `)
      .eq('status', 'active')
      .limit(3)

    if (manualError) {
      console.error('❌ Error with manual checkout query:', manualError)
    } else {
      console.log(`✅ Manual checkout query: Found ${manualCheckout.length} plans`)
      manualCheckout.forEach((plan, index) => {
        console.log(`   Plan ${index + 1}: ${plan.plan_id}, Items: ${plan.plan_items?.length || 0}`)
        if (plan.plan_items && plan.plan_items.length > 0) {
          plan.plan_items.forEach((item, itemIndex) => {
            const recipeName = item.recipes?.name || 'Unknown'
            console.log(`     ${itemIndex + 1}. ${recipeName} - $${(item.unit_price_cents || 0) / 100}`)
          })
        }
      })
    }

  } catch (error) {
    console.error('❌ Error in view check:', error)
  }
}

checkDatabaseViews()
