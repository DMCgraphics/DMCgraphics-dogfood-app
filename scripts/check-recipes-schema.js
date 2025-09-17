#!/usr/bin/env node

/**
 * Check the recipes table schema
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkRecipesSchema() {
  console.log('🔍 Checking Recipes Schema...\n')

  try {
    // Get a sample recipe to see the schema
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*')
      .limit(1)

    if (recipesError) {
      console.error('❌ Error fetching recipes:', recipesError)
      return
    }

    if (recipes && recipes.length > 0) {
      console.log('📋 Recipe Schema:')
      const recipe = recipes[0]
      Object.keys(recipe).forEach(key => {
        console.log(`   ${key}: ${typeof recipe[key]} = ${JSON.stringify(recipe[key])}`)
      })
    } else {
      console.log('❌ No recipes found')
    }

    // Get Luigi's plan items with just the recipe name
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
      .eq('dog_id', 'c9fe0058-f45f-44b0-bbc5-01b18688684c') // Luigi's ID
      .eq('status', 'active')
      .single()

    if (planError) {
      console.error('❌ Error fetching plan:', planError)
      return
    }

    console.log('\n📋 Luigi\'s Plan Items:')
    if (plan.plan_items && plan.plan_items.length > 0) {
      plan.plan_items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.recipes?.name || 'Unknown Recipe'}`)
        console.log(`      Qty: ${item.qty || 1} weeks`)
        console.log(`      Amount: $${(item.amount_cents || 0) / 100}`)
        console.log(`      Billing: ${item.billing_interval || 'Unknown'}`)
      })
    }

    // Check if plan includes medical or prescription items based on recipe name
    const hasMedicalItems = plan.plan_items?.some(item => {
      const recipeName = item.recipes?.name?.toLowerCase() || ''
      return recipeName.includes('medical') ||
             recipeName.includes('prescription') ||
             recipeName.includes('renal') ||
             recipeName.includes('kidney') ||
             recipeName.includes('therapeutic') ||
             recipeName.includes('veterinary')
    }) || false

    console.log('\n🔍 Plan Analysis:')
    console.log(`   Has Medical/Prescription Items: ${hasMedicalItems}`)
    
    if (hasMedicalItems) {
      console.log('   ✅ Medical Conditions and Prescription Status widgets should be shown')
    } else {
      console.log('   ❌ Medical Conditions and Prescription Status widgets should be hidden')
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

checkRecipesSchema()
