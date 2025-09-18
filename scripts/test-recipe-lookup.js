#!/usr/bin/env node

// Script to test recipe lookup logic used in plan builder
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Copy the frontend pricing logic inline
const STRIPE_PRICING = {
  "beef-quinoa-harvest": [
    { priceId: "price_1S32GB0R4BbWwBbfY0N2OQyo", amountCents: 2100 },
    { priceId: "price_1S330D0R4BbWwBbfsZMb9vOm", amountCents: 3500 },
    { priceId: "price_1S33yk0R4BbWwBbfKd5a0Jpk", amountCents: 4900 },
    { priceId: "price_1S33zx0R4BbWwBbf1AC8sUHf", amountCents: 6300 },
  ],
  "lamb-pumpkin-feast": [
    { priceId: "price_1S345x0R4BbWwBbfJRGIQ4g5", amountCents: 2100 },
    { priceId: "price_1S346x0R4BbWwBbf1FENODao", amountCents: 3500 },
    { priceId: "price_1S347g0R4BbWwBbfvaKYdyLs", amountCents: 4900 },
    { priceId: "price_1S348p0R4BbWwBbfHoE8iLli", amountCents: 6300 },
  ],
  "low-fat-chicken-garden-veggie": [
    { priceId: "price_1S340d0R4BbWwBbfqjQqMlhv", amountCents: 2100 },
    { priceId: "price_1S341d0R4BbWwBbf7S33jVQr", amountCents: 3500 },
    { priceId: "price_1S342T0R4BbWwBbfQ0v71HSC", amountCents: 4900 },
    { priceId: "price_1S34300R4BbWwBbf5RVMEC8L", amountCents: 6300 },
  ],
  "turkey-brown-rice-comfort": [
    { priceId: "price_1S8ktS0R4BbWwBbfTY4sxMrL", amountCents: 2100 },
    { priceId: "price_1S8ktx0R4BbWwBbfPf6vt2qs", amountCents: 3500 },
    { priceId: "price_1S8kuf0R4BbWwBbfRB6gwhiA", amountCents: 4900 },
    { priceId: "price_1S8kww0R4BbWwBbfGsB8CiwP", amountCents: 6300 },
  ],
}

function getStripePricingForDog(recipeSlug, weightLbs) {
  const recipePricing = STRIPE_PRICING[recipeSlug]
  if (!recipePricing) return null

  let sizeIndex = 0 // Small (5-20 lbs)
  if (weightLbs >= 21 && weightLbs <= 50) sizeIndex = 1 // Medium
  else if (weightLbs >= 51 && weightLbs <= 90) sizeIndex = 2 // Large
  else if (weightLbs >= 91) sizeIndex = 3 // XL

  return recipePricing[sizeIndex] || recipePricing[0]
}

async function testRecipeLookup() {
  console.log('🧪 Testing recipe lookup logic...\n')

  try {
    // Test the exact logic used in plan builder
    const testRecipes = [
      'beef-quinoa-harvest',
      'lamb-pumpkin-feast', 
      'low-fat-chicken-garden-veggie',
      'turkey-brown-rice-comfort'
    ]

    for (const recipeSlug of testRecipes) {
      console.log(`\n📋 Testing recipe: ${recipeSlug}`)

      // 1. Test frontend pricing lookup
      const frontendPricing = getStripePricingForDog(recipeSlug, 28) // 28 lbs dog
      console.log(`   Frontend pricing: ${frontendPricing ? `$${(frontendPricing.amountCents / 100).toFixed(2)} - ${frontendPricing.priceId}` : 'NULL'}`)

      // 2. Test database recipe lookup (exact logic from plan builder)
      const { data: availableRecipes, error: recipesError } = await supabase
        .from("recipes")
        .select("id, name, slug")
        .eq("is_active", true)

      if (recipesError) {
        console.error(`   ❌ Error fetching recipes: ${recipesError.message}`)
        continue
      }

      const recipeData = availableRecipes?.find(
        (r) => r.slug === recipeSlug || r.id === recipeSlug || r.name === recipeSlug,
      )

      if (!recipeData) {
        console.error(`   ❌ Recipe not found in database: ${recipeSlug}`)
        continue
      }

      console.log(`   ✅ Database recipe found: ${recipeData.name} (ID: ${recipeData.id}, Slug: ${recipeData.slug})`)

      // 3. Test Stripe pricing lookup using database slug
      const dbPricing = getStripePricingForDog(recipeData.slug, 28)
      console.log(`   Database pricing: ${dbPricing ? `$${(dbPricing.amountCents / 100).toFixed(2)} - ${dbPricing.priceId}` : 'NULL'}`)

      // 4. Check if there's a mismatch
      if (frontendPricing && dbPricing) {
        if (frontendPricing.priceId === dbPricing.priceId) {
          console.log(`   ✅ Pricing matches between frontend and database`)
        } else {
          console.log(`   ❌ Pricing mismatch!`)
          console.log(`      Frontend: ${frontendPricing.priceId}`)
          console.log(`      Database: ${dbPricing.priceId}`)
        }
      } else if (!frontendPricing && !dbPricing) {
        console.log(`   ❌ No pricing found in either frontend or database`)
      } else {
        console.log(`   ❌ Pricing found in one but not the other`)
      }
    }

    // Test the exact plan builder logic
    console.log('\n🔍 Testing plan builder logic simulation...')
    
    const { data: availableRecipes, error: recipesError } = await supabase
      .from("recipes")
      .select("id, name, slug")
      .eq("is_active", true)

    if (recipesError) {
      console.error('❌ Error fetching recipes:', recipesError)
      return
    }

    console.log('Available recipes in database:')
    availableRecipes.forEach(recipe => {
      console.log(`   - ${recipe.name} (Slug: ${recipe.slug}, ID: ${recipe.id})`)
    })

    // Test each recipe with the plan builder logic
    const testRecipes2 = [
      'beef-quinoa-harvest',
      'lamb-pumpkin-feast', 
      'low-fat-chicken-garden-veggie',
      'turkey-brown-rice-comfort'
    ]

    for (const recipeId of testRecipes2) {
      console.log(`\n🧪 Testing plan builder logic for: ${recipeId}`)
      
      const recipeData = availableRecipes?.find(
        (r) => r.slug === recipeId || r.id === recipeId || r.name === recipeId,
      )

      if (!recipeData) {
        console.log(`   ❌ Recipe not found: ${recipeId}`)
        continue
      }

      console.log(`   ✅ Recipe found: ${recipeData.name}`)
      
      const weightLbs = 28
      const stripePricing = getStripePricingForDog(recipeData.slug, weightLbs)

      if (!stripePricing) {
        console.log(`   ❌ No Stripe pricing found for ${recipeData.slug}`)
        continue
      }

      console.log(`   ✅ Stripe pricing found: $${(stripePricing.amountCents / 100).toFixed(2)} - ${stripePricing.priceId}`)
    }

  } catch (error) {
    console.error('❌ Error in recipe lookup test:', error)
  }
}

testRecipeLookup()
