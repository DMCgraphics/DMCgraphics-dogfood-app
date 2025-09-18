#!/usr/bin/env node

// Script to test recipe lookup for debugging
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testRecipeLookup() {
  console.log('🧪 Testing recipe lookup for debugging...\n')

  try {
    // Test the exact query used in plan builder
    const { data: availableRecipes, error: recipesError } = await supabase
      .from("recipes")
      .select("id, name, slug")
      .eq("is_active", true)

    if (recipesError) {
      console.error('❌ Error fetching recipes:', recipesError)
      return
    }

    console.log(`✅ Found ${availableRecipes.length} active recipes:`)
    availableRecipes.forEach((recipe, index) => {
      console.log(`   ${index + 1}. ${recipe.name} (Slug: ${recipe.slug}, ID: ${recipe.id})`)
    })

    // Test recipe lookup for each of the 4 canonical recipes
    const testRecipeIds = [
      'beef-quinoa-harvest',
      'lamb-pumpkin-feast', 
      'low-fat-chicken-garden-veggie',
      'turkey-brown-rice-comfort'
    ]

    console.log('\n🧪 Testing recipe lookup for each canonical recipe:')
    testRecipeIds.forEach(recipeId => {
      const recipeData = availableRecipes?.find(
        (r) => r.slug === recipeId || r.id === recipeId || r.name === recipeId,
      )

      if (recipeData) {
        console.log(`   ✅ ${recipeId} -> Found: ${recipeData.name} (ID: ${recipeData.id})`)
      } else {
        console.log(`   ❌ ${recipeId} -> NOT FOUND`)
      }
    })

    // Test Stripe pricing lookup
    console.log('\n🧪 Testing Stripe pricing lookup:')
    const { getStripePricingForDog } = require('../lib/stripe-pricing')
    
    testRecipeIds.forEach(recipeId => {
      const recipeData = availableRecipes?.find(
        (r) => r.slug === recipeId || r.id === recipeId || r.name === recipeId,
      )

      if (recipeData) {
        const pricing = getStripePricingForDog(recipeData.slug, 28) // 28 lbs dog
        if (pricing) {
          console.log(`   ✅ ${recipeId} -> $${(pricing.amountCents / 100).toFixed(2)} - ${pricing.priceId}`)
        } else {
          console.log(`   ❌ ${recipeId} -> No pricing found`)
        }
      }
    })

  } catch (error) {
    console.error('❌ Error in recipe lookup test:', error)
  }
}

testRecipeLookup()
