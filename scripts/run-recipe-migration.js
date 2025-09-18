#!/usr/bin/env node

// Script to run the recipe migration using Supabase client
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runRecipeMigration() {
  console.log('🔄 Running recipe migration...\n')

  try {
    // 1. Upsert the 4 canonical recipes
    console.log('1. Upserting canonical recipes...')
    
    const recipes = [
      {
        name: 'Beef & Quinoa Harvest',
        description: 'Lean beef with quinoa and veggies for balanced nutrition.',
        ingredients: ['Lean ground beef','Quinoa','Carrots','Zucchini','Spinach','Balance IT supplement','Fish oil'],
        is_active: true,
        status: 'active',
        size: '400g',
        price: 0,
        allergens: ['beef']
      },
      {
        name: 'Lamb & Pumpkin Feast',
        description: 'Lamb with pumpkin, quinoa, and greens for sensitive digestion.',
        ingredients: ['Ground lamb','Pumpkin purée','Quinoa','Carrots','Kale or spinach','Balance IT supplement','Fish oil'],
        is_active: true,
        status: 'active',
        size: '400g',
        price: 0,
        allergens: ['lamb']
      },
      {
        name: 'Low-Fat Chicken & Garden Veggie',
        description: 'Low-fat chicken breast, egg whites, quinoa, and greens.',
        ingredients: ['Skinless chicken breast','Egg whites','Quinoa','Carrots (lightened with zucchini when needed)','Spinach','Balance IT supplement','Fish oil'],
        is_active: true,
        status: 'active',
        size: '400g',
        price: 0,
        allergens: ['chicken','egg']
      },
      {
        name: 'Turkey & Brown Rice Comfort',
        description: 'Lean turkey with brown rice and garden vegetables.',
        ingredients: ['Lean ground turkey','Brown rice','Carrots','Zucchini','Spinach','Balance IT supplement','Fish oil'],
        is_active: true,
        status: 'active',
        size: '400g',
        price: 0,
        allergens: ['turkey']
      }
    ]

    for (const recipe of recipes) {
      const { data, error } = await supabase
        .from('recipes')
        .upsert(recipe, { 
          onConflict: 'name',
          ignoreDuplicates: false 
        })
        .select('id, name')

      if (error) {
        console.error(`❌ Error upserting recipe ${recipe.name}:`, error)
      } else {
        console.log(`✅ Upserted recipe: ${recipe.name} (ID: ${data[0].id})`)
      }
    }

    // 2. Get the recipe IDs for price mapping
    console.log('\n2. Getting recipe IDs for price mapping...')
    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .select('id, name')
      .in('name', recipes.map(r => r.name))

    if (recipeError) {
      console.error('❌ Error fetching recipe IDs:', recipeError)
      return
    }

    console.log('✅ Recipe IDs:')
    recipeData.forEach(recipe => {
      console.log(`   ${recipe.name}: ${recipe.id}`)
    })

    // 3. Map Stripe price IDs to product_prices table
    console.log('\n3. Mapping Stripe price IDs...')
    
    const priceMappings = [
      // Beef & Quinoa Harvest
      { recipeName: 'Beef & Quinoa Harvest', sizeG: 400, priceId: 'price_1S32GB0R4BbWwBbfY0N2OQyo', amountCents: 2100 },
      { recipeName: 'Beef & Quinoa Harvest', sizeG: 700, priceId: 'price_1S330D0R4BbWwBbfsZMb9vOm', amountCents: 3500 },
      { recipeName: 'Beef & Quinoa Harvest', sizeG: 1000, priceId: 'price_1S33yk0R4BbWwBbfKd5a0Jpk', amountCents: 4900 },
      { recipeName: 'Beef & Quinoa Harvest', sizeG: 1300, priceId: 'price_1S33zx0R4BbWwBbf1AC8sUHf', amountCents: 6300 },
      
      // Lamb & Pumpkin Feast
      { recipeName: 'Lamb & Pumpkin Feast', sizeG: 400, priceId: 'price_1S345x0R4BbWwBbfJRGIQ4g5', amountCents: 2100 },
      { recipeName: 'Lamb & Pumpkin Feast', sizeG: 700, priceId: 'price_1S346x0R4BbWwBbf1FENODao', amountCents: 3500 },
      { recipeName: 'Lamb & Pumpkin Feast', sizeG: 1000, priceId: 'price_1S347g0R4BbWwBbfvaKYdyLs', amountCents: 4900 },
      { recipeName: 'Lamb & Pumpkin Feast', sizeG: 1300, priceId: 'price_1S348p0R4BbWwBbfHoE8iLli', amountCents: 6300 },
      
      // Low-Fat Chicken & Garden Veggie
      { recipeName: 'Low-Fat Chicken & Garden Veggie', sizeG: 400, priceId: 'price_1S340d0R4BbWwBbfqjQqMlhv', amountCents: 2100 },
      { recipeName: 'Low-Fat Chicken & Garden Veggie', sizeG: 700, priceId: 'price_1S341d0R4BbWwBbf7S33jVQr', amountCents: 3500 },
      { recipeName: 'Low-Fat Chicken & Garden Veggie', sizeG: 1000, priceId: 'price_1S342T0R4BbWwBbfQ0v71HSC', amountCents: 4900 },
      { recipeName: 'Low-Fat Chicken & Garden Veggie', sizeG: 1300, priceId: 'price_1S34300R4BbWwBbf5RVMEC8L', amountCents: 6300 },
      
      // Turkey & Brown Rice Comfort
      { recipeName: 'Turkey & Brown Rice Comfort', sizeG: 400, priceId: 'price_1S8ktS0R4BbWwBbfTY4sxMrL', amountCents: 2100 },
      { recipeName: 'Turkey & Brown Rice Comfort', sizeG: 700, priceId: 'price_1S8ktx0R4BbWwBbfPf6vt2qs', amountCents: 3500 },
      { recipeName: 'Turkey & Brown Rice Comfort', sizeG: 1000, priceId: 'price_1S8kuf0R4BbWwBbfRB6gwhiA', amountCents: 4900 },
      { recipeName: 'Turkey & Brown Rice Comfort', sizeG: 1300, priceId: 'price_1S8kww0R4BbWwBbfGsB8CiwP', amountCents: 6300 }
    ]

    for (const mapping of priceMappings) {
      const recipe = recipeData.find(r => r.name === mapping.recipeName)
      if (!recipe) {
        console.error(`❌ Recipe not found: ${mapping.recipeName}`)
        continue
      }

      const { error: priceError } = await supabase
        .from('product_prices')
        .upsert({
          recipe_id: recipe.id,
          size_g: mapping.sizeG,
          unit_price_cents: mapping.amountCents,
          billing_interval: 'week',
          stripe_price_id: mapping.priceId,
          active: true
        }, {
          onConflict: 'stripe_price_id',
          ignoreDuplicates: false
        })

      if (priceError) {
        console.error(`❌ Error upserting price for ${mapping.recipeName} (${mapping.sizeG}g):`, priceError)
      } else {
        console.log(`✅ Upserted price: ${mapping.recipeName} (${mapping.sizeG}g) - $${mapping.amountCents/100}`)
      }
    }

    // 4. Deactivate old recipes
    console.log('\n4. Deactivating old recipes...')
    const { error: deactivateError } = await supabase
      .from('recipes')
      .update({ 
        is_active: false, 
        status: 'deprecated' 
      })
      .not('name', 'in', `(${recipes.map(r => `'${r.name}'`).join(',')})`)

    if (deactivateError) {
      console.error('❌ Error deactivating old recipes:', deactivateError)
    } else {
      console.log('✅ Deactivated old recipes')
    }

    console.log('\n🎉 Recipe migration completed!')

  } catch (error) {
    console.error('❌ Error in migration script:', error)
  }
}

runRecipeMigration()
