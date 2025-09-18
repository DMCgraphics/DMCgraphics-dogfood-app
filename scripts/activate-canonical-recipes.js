#!/usr/bin/env node

// Script to activate the canonical recipes
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function activateCanonicalRecipes() {
  console.log('🔄 Activating canonical recipes...\n')

  try {
    const canonicalSlugs = [
      'beef-quinoa-harvest',
      'lamb-pumpkin-feast', 
      'low-fat-chicken-garden-veggie',
      'turkey-brown-rice-comfort'
    ]

    const { error } = await supabase
      .from('recipes')
      .update({ 
        is_active: true, 
        status: 'active' 
      })
      .in('slug', canonicalSlugs)

    if (error) {
      console.error('❌ Error activating canonical recipes:', error)
    } else {
      console.log('✅ Activated canonical recipes')
    }

    // Verify the activation
    const { data: recipes, error: fetchError } = await supabase
      .from('recipes')
      .select('name, slug, is_active, status')
      .in('slug', canonicalSlugs)
      .order('name')

    if (fetchError) {
      console.error('❌ Error fetching recipes:', fetchError)
    } else {
      console.log('\n✅ Canonical recipes status:')
      recipes.forEach(recipe => {
        console.log(`   ${recipe.name} (${recipe.slug}): Active=${recipe.is_active}, Status=${recipe.status}`)
      })
    }

  } catch (error) {
    console.error('❌ Error in activation script:', error)
  }
}

activateCanonicalRecipes()
