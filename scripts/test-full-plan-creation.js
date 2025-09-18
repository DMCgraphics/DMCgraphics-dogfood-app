#!/usr/bin/env node

// Script to test the full plan creation process
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFullPlanCreation() {
  console.log('🧪 Testing full plan creation process...\n')

  try {
    // Get the user ID for dcohen@nouripet.net
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return
    }

    const user = authUsers.users.find(u => u.email === 'dcohen@nouripet.net')
    if (!user) {
      console.error('❌ User dcohen@nouripet.net not found')
      return
    }

    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`)

    // Get the Turkey recipe
    const { data: turkeyRecipe, error: recipeError } = await supabase
      .from('recipes')
      .select('*')
      .eq('slug', 'turkey-brown-rice-comfort')
      .eq('is_active', true)
      .single()

    if (recipeError) {
      console.error('❌ Error fetching Turkey recipe:', recipeError)
      return
    }

    console.log(`✅ Found Turkey recipe: ${turkeyRecipe.name} (ID: ${turkeyRecipe.id})`)

    // Check if user already has a dog named Luigi
    const { data: existingDog, error: dogCheckError } = await supabase
      .from('dogs')
      .select('*')
      .eq('user_id', user.id)
      .eq('name', 'Luigi')
      .single()

    let dogId
    if (dogCheckError && dogCheckError.code === 'PGRST116') {
      // Dog doesn't exist, create it
      console.log('\n🔄 Creating Luigi dog...')
      const { data: newDog, error: dogError } = await supabase
        .from('dogs')
        .insert({
          user_id: user.id,
          name: 'Luigi',
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
        console.error('❌ Error creating Luigi dog:', dogError)
        return
      }

      dogId = newDog.id
      console.log(`✅ Created Luigi dog: ${dogId}`)
    } else if (dogCheckError) {
      console.error('❌ Error checking for Luigi dog:', dogCheckError)
      return
    } else {
      dogId = existingDog.id
      console.log(`✅ Found existing Luigi dog: ${dogId}`)
    }

    // Check if user already has an active plan
    const { data: existingPlan, error: planCheckError } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    let planId
    if (planCheckError && planCheckError.code === 'PGRST116') {
      // No active plan, create one
      console.log('\n🔄 Creating new plan...')
      const { data: newPlan, error: planError } = await supabase
        .from('plans')
        .insert({
          user_id: user.id,
          dog_id: dogId,
          status: 'draft',
          current_step: 4,
          subtotal_cents: 0,
          discount_cents: 0,
          total_cents: 0
        })
        .select('id')
        .single()

      if (planError) {
        console.error('❌ Error creating plan:', planError)
        return
      }

      planId = newPlan.id
      console.log(`✅ Created plan: ${planId}`)
    } else if (planCheckError) {
      console.error('❌ Error checking for existing plan:', planCheckError)
      return
    } else {
      planId = existingPlan.id
      console.log(`✅ Found existing plan: ${planId}`)
    }

    // Create plan item
    console.log('\n🔄 Creating plan item...')
    const { data: planItem, error: planItemError } = await supabase
      .from('plan_items')
      .insert({
        plan_id: planId,
        dog_id: dogId,
        recipe_id: turkeyRecipe.id,
        qty: 1,
        size_g: 400,
        billing_interval: 'week',
        stripe_price_id: 'price_1S8ktS0R4BbWwBbfTY4sxMrL', // Turkey small price
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
          stripe_product_name: 'Turkey & Brown Rice Comfort – Small (5–20 lbs) (Weekly)'
        }
      })
      .select('id')
      .single()

    if (planItemError) {
      console.error('❌ Error creating plan item:', planItemError)
      return
    }

    console.log(`✅ Created plan item: ${planItem.id}`)

    // Update plan totals
    console.log('\n🔄 Updating plan totals...')
    const { error: updateError } = await supabase
      .from('plans')
      .update({
        subtotal_cents: 2100,
        discount_cents: 0,
        total_cents: 2100,
        status: 'active'
      })
      .eq('id', planId)

    if (updateError) {
      console.error('❌ Error updating plan totals:', updateError)
      return
    }

    console.log('✅ Updated plan totals')

    // Test checkout lines
    console.log('\n🔍 Testing checkout lines...')
    const { data: checkoutLines, error: checkoutError } = await supabase
      .from('current_user_checkout_lines')
      .select('*')

    if (checkoutError) {
      console.error('❌ Error fetching checkout lines:', checkoutError)
    } else {
      console.log(`✅ Found ${checkoutLines.length} checkout line records`)
    }

    console.log('\n🎉 Full plan creation test completed successfully!')

  } catch (error) {
    console.error('❌ Error in full plan creation test:', error)
  }
}

testFullPlanCreation()
