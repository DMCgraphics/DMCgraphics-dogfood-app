#!/usr/bin/env node

// Script to test plan item creation directly
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testPlanItemCreation() {
  console.log('🧪 Testing plan item creation...\n')

  try {
    // Get the current user
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching users:', authError)
      return
    }

    const user = authUsers.users.find(u => u.email === 'dcohen209@gmail.com')
    if (!user) {
      console.error('❌ User dcohen209@gmail.com not found')
      return
    }

    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`)

    // Get the most recent plan
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('id, user_id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    if (plansError) {
      console.error('❌ Error fetching plans:', plansError)
      return
    }

    if (plans.length === 0) {
      console.error('❌ No active plans found')
      return
    }

    const plan = plans[0]
    console.log(`✅ Found plan: ${plan.id}`)

    // Get a dog for this plan
    const { data: dogs, error: dogsError } = await supabase
      .from('dogs')
      .select('id, name, user_id')
      .eq('user_id', user.id)
      .limit(1)

    if (dogsError) {
      console.error('❌ Error fetching dogs:', dogsError)
      return
    }

    if (dogs.length === 0) {
      console.error('❌ No dogs found')
      return
    }

    const dog = dogs[0]
    console.log(`✅ Found dog: ${dog.name} (ID: ${dog.id})`)

    // Get a recipe
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('id, name, slug')
      .eq('is_active', true)
      .limit(1)

    if (recipesError) {
      console.error('❌ Error fetching recipes:', recipesError)
      return
    }

    if (recipes.length === 0) {
      console.error('❌ No recipes found')
      return
    }

    const recipe = recipes[0]
    console.log(`✅ Found recipe: ${recipe.name} (ID: ${recipe.id})`)

    // Test plan item creation
    console.log('\n🧪 Testing plan item creation...')
    const { data: planItem, error: planItemError } = await supabase
      .from('plan_items')
      .insert({
        plan_id: plan.id,
        dog_id: dog.id,
        recipe_id: recipe.id,
        qty: 1,
        size_g: 400,
        billing_interval: 'week',
        stripe_price_id: 'price_1S32GB0R4BbWwBbfY0N2OQyo', // Use a valid price ID
        unit_price_cents: 2100,
        amount_cents: 2100,
        meta: {
          source: 'test',
          dog_weight: 28,
          weight_unit: 'lb',
          daily_grams: 200,
          monthly_grams: 6000,
          activity_level: 'moderate',
          calculated_calories: 800,
          stripe_product_name: 'Test Product'
        }
      })
      .select('id')
      .single()

    if (planItemError) {
      console.error('❌ Error creating plan item:', planItemError)
      console.error('Error details:', JSON.stringify(planItemError, null, 2))
    } else {
      console.log(`✅ Successfully created plan item: ${planItem.id}`)
    }

  } catch (error) {
    console.error('❌ Error in plan item creation test:', error)
  }
}

testPlanItemCreation()
