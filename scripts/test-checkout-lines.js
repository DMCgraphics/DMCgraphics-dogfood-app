#!/usr/bin/env node

// Script to test the checkout lines view
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCheckoutLines() {
  console.log('🧪 Testing checkout lines view...\n')

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

    // Get the user's dog (Teddy)
    const { data: dog, error: dogError } = await supabase
      .from('dogs')
      .select('*')
      .eq('user_id', user.id)
      .eq('name', 'Teddy')
      .single()

    if (dogError) {
      console.error('❌ Error fetching dog:', dogError)
      return
    }

    console.log(`✅ Found dog: ${dog.name} (ID: ${dog.id})`)

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

    // Create a test plan with correct schema
    console.log('\n🔄 Creating test plan...')
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .insert({
        user_id: user.id,
        dog_id: dog.id,
        status: 'active',
        current_step: 4,
        subtotal_cents: 2100,
        discount_cents: 0,
        total_cents: 2100
      })
      .select('id')
      .single()

    if (planError) {
      console.error('❌ Error creating plan:', planError)
      return
    }

    console.log(`✅ Created plan: ${plan.id}`)

    // Create a plan item
    console.log('\n🔄 Creating plan item...')
    const { data: planItem, error: planItemError } = await supabase
      .from('plan_items')
      .insert({
        plan_id: plan.id,
        dog_id: dog.id,
        recipe_id: turkeyRecipe.id,
        qty: 1,
        size_g: 400,
        billing_interval: 'week',
        stripe_price_id: 'price_1S8ktS0R4BbWwBbfTY4sxMrL', // Turkey small price
        unit_price_cents: 2100,
        amount_cents: 2100,
        meta: {
          source: 'test',
          dog_weight: 20,
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

    // Test the checkout lines view
    console.log('\n🔍 Testing checkout lines view...')
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

    // Test with the user's session
    console.log('\n🔍 Testing with user session...')
    const { data: sessionCheckoutLines, error: sessionError } = await supabase
      .from('current_user_checkout_lines')
      .select('*')
      .eq('user_id', user.id)

    if (sessionError) {
      console.error('❌ Error fetching session checkout lines:', sessionError)
    } else {
      console.log(`✅ Found ${sessionCheckoutLines.length} session checkout line records`)
    }

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...')
    await supabase.from('plan_items').delete().eq('id', planItem.id)
    await supabase.from('plans').delete().eq('id', plan.id)
    console.log('✅ Test data cleaned up')

  } catch (error) {
    console.error('❌ Error in test script:', error)
  }
}

testCheckoutLines()
