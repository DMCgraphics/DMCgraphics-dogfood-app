#!/usr/bin/env node

/**
 * Check the actual columns in dog_notes table
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDogNotesColumns() {
  console.log('🔍 Checking dog_notes Table Columns...\n')

  try {
    // Try to insert a test record to see what columns are expected
    const testData = {
      dog_id: 'c9fe0058-f45f-44b0-bbc5-01b18688684c', // Luigi's ID
      type: 'stool',
      score: 4,
      notes: 'Test entry',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('🧪 Testing insert with expected columns:')
    console.log(JSON.stringify(testData, null, 2))

    const { data: insertResult, error: insertError } = await supabase
      .from('dog_notes')
      .insert(testData)
      .select()

    if (insertError) {
      console.log('❌ Insert failed:', insertError.message)
      console.log('This tells us what columns are missing or incorrect')
    } else {
      console.log('✅ Insert succeeded:', insertResult)
      
      // Clean up the test record
      await supabase
        .from('dog_notes')
        .delete()
        .eq('id', insertResult[0].id)
      console.log('🧹 Test record cleaned up')
    }

    // Try a simpler insert to see what the minimum required columns are
    console.log('\n🧪 Testing minimal insert:')
    const minimalData = {
      dog_id: 'c9fe0058-f45f-44b0-bbc5-01b18688684c'
    }

    const { data: minimalResult, error: minimalError } = await supabase
      .from('dog_notes')
      .insert(minimalData)
      .select()

    if (minimalError) {
      console.log('❌ Minimal insert failed:', minimalError.message)
    } else {
      console.log('✅ Minimal insert succeeded:', minimalResult)
      
      // Clean up
      await supabase
        .from('dog_notes')
        .delete()
        .eq('id', minimalResult[0].id)
      console.log('🧹 Minimal test record cleaned up')
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

checkDogNotesColumns()
