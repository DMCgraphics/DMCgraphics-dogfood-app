#!/usr/bin/env node

/**
 * Fix missing plan items for a user's plan
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixMissingPlanItems(userEmail) {
  console.log(`🔧 Fixing missing plan items for ${userEmail}...\n`)

  try {
    // Step 1: Find the user
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message)
      return
    }
    
    const user = users.users.find(u => u.email === userEmail)
    if (!user) {
      console.log(`❌ User ${userEmail} not found`)
      return
    }
    
    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`)
    const userId = user.id

    // Step 2: Find the plan that needs fixing
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('id, dog_id, status, total_cents')
      .eq('user_id', userId)
      .in('status', ['checkout_in_progress', 'draft'])
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (plansError) {
      console.error('❌ Error fetching plans:', plansError.message)
      return
    }
    
    if (!plans || plans.length === 0) {
      console.log('❌ No plans found for this user')
      return
    }
    
    const plan = plans[0]
    console.log(`✅ Found plan: ${plan.id} (Status: ${plan.status})`)
    console.log(`   Dog ID: ${plan.dog_id}`)
    console.log(`   Total: $${(plan.total_cents || 0) / 100}`)

    // Step 3: Check if plan items already exist
    const { data: existingItems, error: itemsError } = await supabase
      .from('plan_items')
      .select('id')
      .eq('plan_id', plan.id)
    
    if (itemsError) {
      console.error('❌ Error checking existing plan items:', itemsError.message)
      return
    }
    
    if (existingItems && existingItems.length > 0) {
      console.log(`✅ Plan already has ${existingItems.length} plan items`)
      return
    }

    // Step 4: Get the dog details
    const { data: dog, error: dogError } = await supabase
      .from('dogs')
      .select('id, name, weight, weight_unit')
      .eq('id', plan.dog_id)
      .single()
    
    if (dogError) {
      console.error('❌ Error fetching dog:', dogError.message)
      return
    }
    
    console.log(`✅ Found dog: ${dog.name} (${dog.weight} ${dog.weight_unit})`)

    // Step 5: Get available recipes
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('id, name, slug')
      .limit(10)
    
    if (recipesError) {
      console.error('❌ Error fetching recipes:', recipesError.message)
      return
    }
    
    console.log(`✅ Found ${recipes.length} available recipes`)

    // Step 6: Create plan items (let's add a default recipe)
    // For now, let's add the "Lamb & Quinoa" recipe as it's commonly selected
    const defaultRecipe = recipes.find(r => r.name === 'Lamb & Quinoa') || recipes[0]
    
    if (!defaultRecipe) {
      console.log('❌ No recipes available to add')
      return
    }
    
    console.log(`✅ Adding recipe: ${defaultRecipe.name}`)

    // Calculate pricing (simplified)
    const weight = dog.weight || 20
    const weightUnit = dog.weight_unit || 'lb'
    const weightKg = weightUnit === 'lb' ? weight * 0.453592 : weight
    
    // Simple pricing calculation: $2.50 per kg per week
    const weeklyPriceCents = Math.round(weightKg * 2.50 * 100)
    
    console.log(`   Calculated weekly price: $${(weeklyPriceCents / 100).toFixed(2)}`)

    // Step 7: Create the plan item
    const { data: planItem, error: planItemError } = await supabase
      .from('plan_items')
      .insert({
        plan_id: plan.id,
        dog_id: dog.id,
        recipe_id: defaultRecipe.id,
        qty: 1,
        size_g: Math.round(weightKg * 1000), // Convert kg to grams
        billing_interval: 'week',
        unit_price_cents: weeklyPriceCents,
        amount_cents: weeklyPriceCents,
        meta: {
          source: 'manual_fix',
          dog_weight: weight,
          weight_unit: weightUnit,
          weight_kg: weightKg,
          recipe_name: defaultRecipe.name,
        },
      })
      .select('id')
      .single()
    
    if (planItemError) {
      console.error('❌ Error creating plan item:', planItemError.message)
      return
    }
    
    console.log(`✅ Created plan item: ${planItem.id}`)

    // Step 8: Update plan total
    const { error: updatePlanError } = await supabase
      .from('plans')
      .update({
        total_cents: weeklyPriceCents,
        updated_at: new Date().toISOString(),
      })
      .eq('id', plan.id)
    
    if (updatePlanError) {
      console.error('❌ Error updating plan total:', updatePlanError.message)
    } else {
      console.log(`✅ Updated plan total to $${(weeklyPriceCents / 100).toFixed(2)}`)
    }

    console.log('\n🎉 Plan items fixed successfully!')
    console.log('   The checkout page should now show the cart items.')

  } catch (error) {
    console.error('❌ Fatal error during fix:', error)
  }
}

// Get the email from command line argument or use default
const userEmail = process.argv[2] || 'mnassty@gmail.com'

console.log(`🎯 Target user: ${userEmail}`)
console.log('')

// Run immediately
fixMissingPlanItems(userEmail).catch(console.error)
