#!/usr/bin/env node

/**
 * Debug the exact structure of plan items data
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugPlanItemsStructure() {
  console.log('🔍 Debugging Plan Items Structure...\n')

  try {
    // Get the plan with plan items
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select(`
        *,
        plan_items (
          *,
          recipes (
            name
          )
        )
      `)
      .eq('id', 'b794c176-4186-415f-87a7-8bc4a8be8af6')
      .single()

    if (planError) {
      console.error('❌ Error fetching plan:', planError)
      return
    }

    console.log('📋 Plan Structure:')
    console.log(`   Plan ID: ${plan.id}`)
    console.log(`   Dog ID: ${plan.dog_id}`)
    console.log(`   Status: ${plan.status}`)
    
    console.log('\n📋 Plan Items Structure:')
    if (plan.plan_items && plan.plan_items.length > 0) {
      plan.plan_items.forEach((item, index) => {
        console.log(`   ${index + 1}. Plan Item:`)
        console.log(`      ID: ${item.id}`)
        console.log(`      Name: ${item.name}`)
        console.log(`      Qty: ${item.qty}`)
        console.log(`      Recipe ID: ${item.recipe_id}`)
        console.log(`      Recipes object: ${JSON.stringify(item.recipes, null, 2)}`)
        console.log(`      Full item: ${JSON.stringify(item, null, 2)}`)
      })
    } else {
      console.log('   ❌ No plan items found')
    }

    // Test the mapping logic
    console.log('\n🧪 Testing Mapping Logic:')
    const items = plan.plan_items?.map((item) => {
      console.log(`   Processing item: ${JSON.stringify(item, null, 2)}`)
      
      if (item.recipes) {
        const result = `${item.recipes.name} (${item.qty || 1} weeks)`
        console.log(`   ✅ Using recipes.name: ${result}`)
        return result
      } else if (item.name) {
        const result = item.name
        console.log(`   ✅ Using item.name: ${result}`)
        return result
      } else {
        console.log(`   ❌ No recipe or name found`)
        return 'Unknown Item'
      }
    }) || []

    console.log(`\n📋 Final Items Array: ${JSON.stringify(items, null, 2)}`)

  } catch (error) {
    console.error('❌ Debug failed:', error.message)
  }
}

debugPlanItemsStructure()
