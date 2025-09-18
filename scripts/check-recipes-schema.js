#!/usr/bin/env node

// Script to check the recipes table schema
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRecipesSchema() {
  console.log('🔍 Checking recipes table schema...\n')

  try {
    // Get a sample recipe to see the schema
    const { data: sampleRecipe, error } = await supabase
      .from('recipes')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      console.error('❌ Error fetching sample recipe:', error)
      return
    }

    console.log('✅ Sample recipe structure:')
    console.log(JSON.stringify(sampleRecipe, null, 2))

    // Try to insert a simple recipe to see what columns are available
    console.log('\n🧪 Testing recipe insertion...')
    const testRecipe = {
      name: 'Test Recipe',
      description: 'Test description',
      ingredients: ['test ingredient'],
      is_active: true,
      status: 'active'
    }

    const { data: insertData, error: insertError } = await supabase
      .from('recipes')
      .insert(testRecipe)
      .select('*')

    if (insertError) {
      console.error('❌ Error inserting test recipe:', insertError)
    } else {
      console.log('✅ Test recipe inserted successfully:')
      console.log(JSON.stringify(insertData[0], null, 2))
      
      // Clean up the test recipe
      await supabase
        .from('recipes')
        .delete()
        .eq('id', insertData[0].id)
      console.log('✅ Test recipe cleaned up')
    }

  } catch (error) {
    console.error('❌ Error in schema check:', error)
  }
}

checkRecipesSchema()