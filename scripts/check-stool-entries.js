#!/usr/bin/env node

/**
 * Check stool entries in the database
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkStoolEntries() {
  console.log('🔍 Checking Stool Entries...\n')

  try {
    // Get all stool entries for the user
    const { data: stoolEntries, error: stoolError } = await supabase
      .from('dog_notes')
      .select('*')
      .eq('user_id', '54425ad2-2939-48b2-9ffa-1cff716ea943') // Dylan's user ID
      .eq('type', 'stool')
      .order('created_at', { ascending: false })

    if (stoolError) {
      console.error('❌ Error fetching stool entries:', stoolError)
      return
    }

    console.log(`📋 Found ${stoolEntries.length} stool entries:`)
    
    if (stoolEntries.length > 0) {
      stoolEntries.forEach((entry, index) => {
        const date = new Date(entry.created_at).toLocaleDateString()
        console.log(`   ${index + 1}. Score ${entry.score} - ${date}`)
        console.log(`      Notes: ${entry.notes || 'No notes'}`)
        console.log(`      Dog ID: ${entry.dog_id}`)
      })
    } else {
      console.log('   ❌ No stool entries found')
      console.log('   The dashboard will use mock data until real entries are added')
    }

    // Check the dog_notes table structure
    console.log('\n📋 Checking dog_notes table structure:')
    const { data: sampleNote, error: noteError } = await supabase
      .from('dog_notes')
      .select('*')
      .limit(1)

    if (noteError) {
      console.error('❌ Error fetching sample note:', noteError)
    } else if (sampleNote && sampleNote.length > 0) {
      console.log('   Sample note structure:')
      Object.keys(sampleNote[0]).forEach(key => {
        console.log(`      ${key}: ${typeof sampleNote[0][key]}`)
      })
    } else {
      console.log('   ❌ No notes found in dog_notes table')
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

checkStoolEntries()
