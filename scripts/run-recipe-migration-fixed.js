#!/usr/bin/env node

// Fixed script to run the recipe migration using correct schema
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runRecipeMigrationFixed() {
  console.log('🔄 Running fixed recipe migration...\n')

  try {
    // 1. Upsert the 4 canonical recipes with correct schema
    console.log('1. Upserting canonical recipes...')
    
    const recipes = [
      {
        name: 'Beef & Quinoa Harvest',
        slug: 'beef-quinoa-harvest',
        description: 'Lean beef with quinoa and veggies for balanced nutrition.',
        ingredients: [
          { name: 'Lean ground beef', grams: 200 },
          { name: 'Quinoa', grams: 80 },
          { name: 'Carrots', grams: 40 },
          { name: 'Zucchini', grams: 32 },
          { name: 'Spinach', grams: 32 },
          { name: 'Balance IT', grams: 8 },
          { name: 'Fish oil', grams: 8 }
        ],
        allergens: ['beef'],
        is_active: true,
        status: 'active',
        macros: { protein: 48, fat: 16, carbs: 22 }
      },
      {
        name: 'Lamb & Pumpkin Feast',
        slug: 'lamb-pumpkin-feast',
        description: 'Lamb with pumpkin, quinoa, and greens for sensitive digestion.',
        ingredients: [
          { name: 'Ground lamb', grams: 200 },
          { name: 'Pumpkin purée', grams: 60 },
          { name: 'Quinoa', grams: 60 },
          { name: 'Carrots', grams: 32 },
          { name: 'Kale or spinach', grams: 32 },
          { name: 'Balance IT', grams: 8 },
          { name: 'Fish oil', grams: 8 }
        ],
        allergens: ['lamb'],
        is_active: true,
        status: 'active',
        macros: { protein: 46, fat: 15, carbs: 24 }
      },
      {
        name: 'Low-Fat Chicken & Garden Veggie',
        slug: 'low-fat-chicken-garden-veggie',
        description: 'Low-fat chicken breast, egg whites, quinoa, and greens.',
        ingredients: [
          { name: 'Skinless chicken breast', grams: 192 },
          { name: 'Egg whites', grams: 40 },
          { name: 'Quinoa', grams: 72 },
          { name: 'Carrots (with zucchini adjustment)', grams: 40 },
          { name: 'Spinach', grams: 40 },
          { name: 'Balance IT', grams: 8 },
          { name: 'Fish oil', grams: 8 }
        ],
        allergens: ['chicken', 'egg'],
        is_active: true,
        status: 'active',
        macros: { protein: 45, fat: 15, carbs: 25 }
      },
      {
        name: 'Turkey & Brown Rice Comfort',
        slug: 'turkey-brown-rice-comfort',
        description: 'Lean turkey with brown rice and garden vegetables.',
        ingredients: [
          { name: 'Lean ground turkey', grams: 200 },
          { name: 'Brown rice', grams: 72 },
          { name: 'Carrots', grams: 40 },
          { name: 'Zucchini', grams: 40 },
          { name: 'Spinach', grams: 40 },
          { name: 'Balance IT', grams: 4 },
          { name: 'Fish oil', grams: 4 }
        ],
        allergens: ['turkey'],
        is_active: true,
        status: 'active',
        macros: { protein: 47, fat: 14, carbs: 26 }
      }
    ]

    for (const recipe of recipes) {
      const { data, error } = await supabase
        .from('recipes')
        .upsert(recipe, { 
          onConflict: 'slug',
          ignoreDuplicates: false 
        })
        .select('id, name, slug')

      if (error) {
        console.error(`❌ Error upserting recipe ${recipe.name}:`, error)
      } else {
        console.log(`✅ Upserted recipe: ${recipe.name} (ID: ${data[0].id}, Slug: ${data[0].slug})`)
      }
    }

    // 2. Get the recipe IDs for price mapping
    console.log('\n2. Getting recipe IDs for price mapping...')
    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .select('id, name, slug')
      .in('slug', recipes.map(r => r.slug))

    if (recipeError) {
      console.error('❌ Error fetching recipe IDs:', recipeError)
      return
    }

    console.log('✅ Recipe IDs:')
    recipeData.forEach(recipe => {
      console.log(`   ${recipe.name} (${recipe.slug}): ${recipe.id}`)
    })

    // 3. Map Stripe price IDs to product_prices table
    console.log('\n3. Mapping Stripe price IDs...')
    
    const priceMappings = [
      // Beef & Quinoa Harvest
      { slug: 'beef-quinoa-harvest', sizeG: 400, priceId: 'price_1S32GB0R4BbWwBbfY0N2OQyo', amountCents: 2100 },
      { slug: 'beef-quinoa-harvest', sizeG: 700, priceId: 'price_1S330D0R4BbWwBbfsZMb9vOm', amountCents: 3500 },
      { slug: 'beef-quinoa-harvest', sizeG: 1000, priceId: 'price_1S33yk0R4BbWwBbfKd5a0Jpk', amountCents: 4900 },
      { slug: 'beef-quinoa-harvest', sizeG: 1300, priceId: 'price_1S33zx0R4BbWwBbf1AC8sUHf', amountCents: 6300 },
      
      // Lamb & Pumpkin Feast
      { slug: 'lamb-pumpkin-feast', sizeG: 400, priceId: 'price_1S345x0R4BbWwBbfJRGIQ4g5', amountCents: 2100 },
      { slug: 'lamb-pumpkin-feast', sizeG: 700, priceId: 'price_1S346x0R4BbWwBbf1FENODao', amountCents: 3500 },
      { slug: 'lamb-pumpkin-feast', sizeG: 1000, priceId: 'price_1S347g0R4BbWwBbfvaKYdyLs', amountCents: 4900 },
      { slug: 'lamb-pumpkin-feast', sizeG: 1300, priceId: 'price_1S348p0R4BbWwBbfHoE8iLli', amountCents: 6300 },
      
      // Low-Fat Chicken & Garden Veggie
      { slug: 'low-fat-chicken-garden-veggie', sizeG: 400, priceId: 'price_1S340d0R4BbWwBbfqjQqMlhv', amountCents: 2100 },
      { slug: 'low-fat-chicken-garden-veggie', sizeG: 700, priceId: 'price_1S341d0R4BbWwBbf7S33jVQr', amountCents: 3500 },
      { slug: 'low-fat-chicken-garden-veggie', sizeG: 1000, priceId: 'price_1S342T0R4BbWwBbfQ0v71HSC', amountCents: 4900 },
      { slug: 'low-fat-chicken-garden-veggie', sizeG: 1300, priceId: 'price_1S34300R4BbWwBbf5RVMEC8L', amountCents: 6300 },
      
      // Turkey & Brown Rice Comfort
      { slug: 'turkey-brown-rice-comfort', sizeG: 400, priceId: 'price_1S8ktS0R4BbWwBbfTY4sxMrL', amountCents: 2100 },
      { slug: 'turkey-brown-rice-comfort', sizeG: 700, priceId: 'price_1S8ktx0R4BbWwBbfPf6vt2qs', amountCents: 3500 },
      { slug: 'turkey-brown-rice-comfort', sizeG: 1000, priceId: 'price_1S8kuf0R4BbWwBbfRB6gwhiA', amountCents: 4900 },
      { slug: 'turkey-brown-rice-comfort', sizeG: 1300, priceId: 'price_1S8kww0R4BbWwBbfGsB8CiwP', amountCents: 6300 }
    ]

    for (const mapping of priceMappings) {
      const recipe = recipeData.find(r => r.slug === mapping.slug)
      if (!recipe) {
        console.error(`❌ Recipe not found: ${mapping.slug}`)
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
        console.error(`❌ Error upserting price for ${mapping.slug} (${mapping.sizeG}g):`, priceError)
      } else {
        console.log(`✅ Upserted price: ${mapping.slug} (${mapping.sizeG}g) - $${mapping.amountCents/100}`)
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
      .not('slug', 'in', `(${recipes.map(r => `'${r.slug}'`).join(',')})`)

    if (deactivateError) {
      console.error('❌ Error deactivating old recipes:', deactivateError)
    } else {
      console.log('✅ Deactivated old recipes')
    }

    console.log('\n🎉 Recipe migration completed successfully!')

  } catch (error) {
    console.error('❌ Error in migration script:', error)
  }
}

runRecipeMigrationFixed()
