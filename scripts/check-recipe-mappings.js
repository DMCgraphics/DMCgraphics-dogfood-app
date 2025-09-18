#!/usr/bin/env node

// Script to check recipe mappings and product prices
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRecipeMappings() {
  console.log('🔍 Checking recipe mappings and product prices...\n')

  try {
    // Check all active recipes in database
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (recipesError) {
      console.error('❌ Error fetching recipes:', recipesError)
      return
    }

    console.log(`✅ Found ${recipes.length} active recipes:`)
    recipes.forEach((recipe, index) => {
      console.log(`   ${index + 1}. ${recipe.name} (Slug: ${recipe.slug}, ID: ${recipe.id})`)
    })

    // Check product_prices table
    console.log('\n🔍 Checking product_prices table...')
    const { data: productPrices, error: pricesError } = await supabase
      .from('product_prices')
      .select(`
        id,
        recipe_id,
        size_g,
        unit_price_cents,
        billing_interval,
        stripe_price_id,
        active,
        recipes (name, slug)
      `)
      .eq('active', true)
      .order('recipe_id, size_g')

    if (pricesError) {
      console.error('❌ Error fetching product prices:', pricesError)
    } else {
      console.log(`✅ Found ${productPrices.length} active product prices:`)
      
      // Group by recipe
      const pricesByRecipe = {}
      productPrices.forEach(price => {
        const recipeName = price.recipes?.name || 'Unknown'
        if (!pricesByRecipe[recipeName]) {
          pricesByRecipe[recipeName] = []
        }
        pricesByRecipe[recipeName].push(price)
      })

      Object.entries(pricesByRecipe).forEach(([recipeName, prices]) => {
        console.log(`\n   📋 ${recipeName}:`)
        prices.forEach(price => {
          console.log(`     - ${price.size_g}g: $${(price.unit_price_cents / 100).toFixed(2)} (${price.billing_interval}) - ${price.stripe_price_id}`)
        })
      })
    }

    // Check which recipes have missing product prices
    console.log('\n🔍 Checking for missing product prices...')
    const recipesWithPrices = new Set(productPrices.map(p => p.recipes?.name).filter(Boolean))
    const recipesWithoutPrices = recipes.filter(r => !recipesWithPrices.has(r.name))

    if (recipesWithoutPrices.length > 0) {
      console.log(`❌ Found ${recipesWithoutPrices.length} recipes without product prices:`)
      recipesWithoutPrices.forEach(recipe => {
        console.log(`   - ${recipe.name} (Slug: ${recipe.slug})`)
      })
    } else {
      console.log('✅ All recipes have product prices')
    }

    // Test the getStripePricingForDog function logic
    console.log('\n🧪 Testing Stripe pricing logic...')
    const testWeights = [15, 30, 60, 100] // Small, Medium, Large, XL

    recipes.forEach(recipe => {
      console.log(`\n📋 Testing ${recipe.name} (${recipe.slug}):`)
      
      testWeights.forEach(weight => {
        // Simulate the getStripePricingForDog logic
        let sizeCategory
        if (weight <= 20) sizeCategory = 'small'
        else if (weight <= 50) sizeCategory = 'medium'
        else if (weight <= 90) sizeCategory = 'large'
        else sizeCategory = 'xl'

        const sizeG = sizeCategory === 'small' ? 400 : 
                     sizeCategory === 'medium' ? 700 :
                     sizeCategory === 'large' ? 1000 : 1300

        const recipePrices = productPrices.filter(p => p.recipes?.slug === recipe.slug)
        const matchingPrice = recipePrices.find(p => p.size_g === sizeG)

        if (matchingPrice) {
          console.log(`   ✅ ${weight}lbs (${sizeCategory}): $${(matchingPrice.unit_price_cents / 100).toFixed(2)} - ${matchingPrice.stripe_price_id}`)
        } else {
          console.log(`   ❌ ${weight}lbs (${sizeCategory}): No price found for ${sizeG}g`)
        }
      })
    })

    // Check for any plan items that failed to save
    console.log('\n🔍 Checking recent plan items...')
    const { data: recentPlanItems, error: planItemsError } = await supabase
      .from('plan_items')
      .select(`
        id,
        recipe_id,
        stripe_price_id,
        unit_price_cents,
        created_at,
        recipes (name, slug)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (planItemsError) {
      console.error('❌ Error fetching plan items:', planItemsError)
    } else {
      console.log(`✅ Found ${recentPlanItems.length} recent plan items:`)
      recentPlanItems.forEach(item => {
        const recipeName = item.recipes?.name || 'Unknown'
        console.log(`   - ${recipeName}: $${(item.unit_price_cents / 100).toFixed(2)} - ${item.stripe_price_id} (${item.created_at})`)
      })
    }

  } catch (error) {
    console.error('❌ Error in recipe mapping check:', error)
  }
}

checkRecipeMappings()
