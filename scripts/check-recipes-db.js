#!/usr/bin/env node

// Script to check if the new recipes exist in the database
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRecipesInDB() {
  console.log('🔍 Checking recipes in database...\n')

  try {
    // Check all recipes in the database
    const { data: allRecipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*')
      .order('name')

    if (recipesError) {
      console.error('❌ Error fetching recipes:', recipesError)
      return
    }

    console.log(`✅ Found ${allRecipes.length} recipes in database:`)
    allRecipes.forEach((recipe, index) => {
      console.log(`   ${index + 1}. ${recipe.name} (ID: ${recipe.id}, Slug: ${recipe.slug || 'N/A'}, Active: ${recipe.is_active})`)
    })

    // Check for our specific new recipes
    const expectedRecipes = [
      'Beef & Quinoa Harvest',
      'Lamb & Pumpkin Feast', 
      'Low-Fat Chicken & Garden Veggie',
      'Turkey & Brown Rice Comfort'
    ]

    console.log('\n🔍 Checking for expected recipes:')
    expectedRecipes.forEach(expectedName => {
      const found = allRecipes.find(r => r.name === expectedName)
      if (found) {
        console.log(`   ✅ ${expectedName}: Found (ID: ${found.id}, Active: ${found.is_active})`)
      } else {
        console.log(`   ❌ ${expectedName}: NOT FOUND`)
      }
    })

    // Check for any plans with the turkey recipe
    console.log('\n🔍 Checking for plans with Turkey recipe...')
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select(`
        id, 
        user_id, 
        status, 
        created_at,
        plan_items (
          id,
          recipe_id,
          recipes (name, slug)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (plansError) {
      console.error('❌ Error fetching plans:', plansError)
    } else {
      console.log(`✅ Found ${plans.length} recent plans:`)
      plans.forEach(plan => {
        console.log(`   Plan ${plan.id} (Status: ${plan.status}, Created: ${plan.created_at})`)
        if (plan.plan_items && plan.plan_items.length > 0) {
          plan.plan_items.forEach(item => {
            const recipeName = item.recipes?.name || 'Unknown'
            console.log(`     - Recipe: ${recipeName} (ID: ${item.recipe_id})`)
          })
        } else {
          console.log(`     - No plan items`)
        }
      })
    }

    // Check the current_user_checkout_lines view
    console.log('\n🔍 Checking current_user_checkout_lines view...')
    const { data: checkoutLines, error: checkoutError } = await supabase
      .from('current_user_checkout_lines')
      .select('*')

    if (checkoutError) {
      console.error('❌ Error fetching checkout lines:', checkoutError)
    } else {
      console.log(`✅ Found ${checkoutLines.length} checkout line records:`)
      checkoutLines.forEach((line, index) => {
        console.log(`   ${index + 1}. Plan ID: ${line.plan_id}, Line Items: ${line.line_items?.length || 0}`)
        if (line.line_items && line.line_items.length > 0) {
          line.line_items.forEach((item, itemIndex) => {
            console.log(`     ${itemIndex + 1}. ${item.recipe_name || 'Unknown Recipe'} - $${(item.unit_amount_cents || 0) / 100}`)
          })
        }
      })
    }

  } catch (error) {
    console.error('❌ Error in script:', error)
  }
}

checkRecipesInDB()
