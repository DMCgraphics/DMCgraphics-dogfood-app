#!/usr/bin/env node

/**
 * Fix the dog_notes insert to use correct columns
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixDogNotesInsert() {
  console.log('🔧 Fixing dog_notes Insert...\n')

  try {
    // Try to insert with just the required columns
    const testData = {
      dog_id: 'c9fe0058-f45f-44b0-bbc5-01b18688684c', // Luigi's ID
      note: 'Test stool entry - score 4'
    }

    console.log('🧪 Testing insert with correct columns:')
    console.log(JSON.stringify(testData, null, 2))

    const { data: insertResult, error: insertError } = await supabase
      .from('dog_notes')
      .insert(testData)
      .select()

    if (insertError) {
      console.log('❌ Insert failed:', insertError.message)
    } else {
      console.log('✅ Insert succeeded!')
      console.log('Result:', JSON.stringify(insertResult, null, 2))
      
      // Clean up the test record
      await supabase
        .from('dog_notes')
        .delete()
        .eq('id', insertResult[0].id)
      console.log('🧹 Test record cleaned up')
    }

    // Now let's create some real stool entries for Luigi
    console.log('\n🔧 Creating Real Stool Entries for Luigi...')
    
    const stoolEntries = [
      {
        dog_id: 'c9fe0058-f45f-44b0-bbc5-01b18688684c',
        note: 'Score 4 - Ideal consistency, well-formed'
      },
      {
        dog_id: 'c9fe0058-f45f-44b0-bbc5-01b18688684c',
        note: 'Score 4 - Perfect stool quality'
      },
      {
        dog_id: 'c9fe0058-f45f-44b0-bbc5-01b18688684c',
        note: 'Score 3 - Slightly firm but normal'
      }
    ]

    const { data: createdEntries, error: createError } = await supabase
      .from('dog_notes')
      .insert(stoolEntries)
      .select()

    if (createError) {
      console.log('❌ Failed to create stool entries:', createError.message)
    } else {
      console.log('✅ Created stool entries successfully!')
      console.log(`   Created ${createdEntries.length} entries`)
      
      // Now test fetching them
      const { data: fetchedEntries, error: fetchError } = await supabase
        .from('dog_notes')
        .select('*')
        .eq('dog_id', 'c9fe0058-f45f-44b0-bbc5-01b18688684c')
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.log('❌ Failed to fetch entries:', fetchError.message)
      } else {
        console.log('✅ Fetched entries successfully!')
        console.log(`   Found ${fetchedEntries.length} entries`)
        fetchedEntries.forEach((entry, index) => {
          const date = new Date(entry.created_at).toLocaleDateString()
          console.log(`   ${index + 1}. ${date}: ${entry.note}`)
        })
      }
    }

  } catch (error) {
    console.error('❌ Fix failed:', error.message)
  }
}

fixDogNotesInsert()
