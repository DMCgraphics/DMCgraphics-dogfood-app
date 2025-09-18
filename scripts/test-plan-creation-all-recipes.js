#!/usr/bin/env node

// Script to test plan creation for all recipes
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testPlanCreationAllRecipes() {
  console.log('🧪 Testing plan creation for all recipes...\n')

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

    // Get all active recipes
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (recipesError) {
      console.error('❌ Error fetching recipes:', recipesError)
      return
    }

    console.log(`✅ Found ${recipes.length} active recipes`)

    // Test each recipe
    for (const recipe of recipes) {
      console.log(`\n🧪 Testing plan creation for: ${recipe.name} (${recipe.slug})`)

      // Create a test dog
      const dogName = `TestDog_${recipe.slug.replace(/-/g, '_')}`
      const { data: testDog, error: dogError } = await supabase
        .from('dogs')
        .insert({
          user_id: user.id,
          name: dogName,
          breed: 'mixed-breed',
          age: 4,
          weight: 28,
          weight_unit: 'lb',
          weight_kg: 28 * 0.453592,
          allergies: [],
          conditions: []
        })
        .select('id')
        .single()

      if (dogError) {
        console.error(`   ❌ Error creating test dog: ${dogError.message}`)
        continue
      }

      console.log(`   ✅ Created test dog: ${dogName} (ID: ${testDog.id})`)

      // Create a test plan
      const { data: testPlan, error: planError } = await supabase
        .from('plans')
        .insert({
          user_id: user.id,
          dog_id: testDog.id,
          status: 'draft',
          current_step: 4,
          subtotal_cents: 0,
          discount_cents: 0,
          total_cents: 0
        })
        .select('id')
        .single()

      if (planError) {
        console.error(`   ❌ Error creating test plan: ${planError.message}`)
        // Clean up dog
        await supabase.from('dogs').delete().eq('id', testDog.id)
        continue
      }

      console.log(`   ✅ Created test plan: ${testPlan.id}`)

      // Create plan-dog relationship
      const { error: planDogError } = await supabase.rpc("upsert_plan_dog", {
        p_plan_id: testPlan.id,
        p_dog_id: testDog.id,
        p_position: 1,
        p_snapshot: null,
        p_meals_per_day: 2,
        p_prescription: null,
        p_verify: false
      })

      if (planDogError) {
        console.error(`   ❌ Error creating plan-dog relationship: ${planDogError.message}`)
        // Clean up
        await supabase.from('plans').delete().eq('id', testPlan.id)
        await supabase.from('dogs').delete().eq('id', testDog.id)
        continue
      }

      console.log(`   ✅ Created plan-dog relationship`)

      // Create plan item
      const { data: planItem, error: planItemError } = await supabase
        .from('plan_items')
        .insert({
          plan_id: testPlan.id,
          dog_id: testDog.id,
          recipe_id: recipe.id,
          qty: 1,
          size_g: 400,
          billing_interval: 'week',
          stripe_price_id: 'price_1S8ktS0R4BbWwBbfTY4sxMrL', // Use a valid price ID
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
            stripe_product_name: `${recipe.name} – Small (5–20 lbs) (Weekly)`
          }
        })
        .select('id')
        .single()

      if (planItemError) {
        console.error(`   ❌ Error creating plan item: ${planItemError.message}`)
        // Clean up
        await supabase.from('plans').delete().eq('id', testPlan.id)
        await supabase.from('dogs').delete().eq('id', testDog.id)
        continue
      }

      console.log(`   ✅ Created plan item: ${planItem.id}`)

      // Update plan totals
      const { error: updateError } = await supabase
        .from('plans')
        .update({
          subtotal_cents: 2100,
          discount_cents: 0,
          total_cents: 2100,
          status: 'active'
        })
        .eq('id', testPlan.id)

      if (updateError) {
        console.error(`   ❌ Error updating plan totals: ${updateError.message}`)
      } else {
        console.log(`   ✅ Updated plan totals`)
      }

      console.log(`   🎉 SUCCESS: Plan creation completed for ${recipe.name}`)

      // Clean up test data
      await supabase.from('plan_items').delete().eq('id', planItem.id)
      await supabase.from('plans').delete().eq('id', testPlan.id)
      await supabase.from('dogs').delete().eq('id', testDog.id)
      console.log(`   🧹 Cleaned up test data`)
    }

    console.log('\n🎉 All recipe tests completed!')

  } catch (error) {
    console.error('❌ Error in plan creation test:', error)
  }
}

testPlanCreationAllRecipes()
