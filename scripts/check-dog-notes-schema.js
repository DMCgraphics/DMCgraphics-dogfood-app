#!/usr/bin/env node

/**
 * Check the dog_notes table schema
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDogNotesSchema() {
  console.log('🔍 Checking dog_notes Table Schema...\n')

  try {
    // Get a sample note to see the schema
    const { data: notes, error: notesError } = await supabase
      .from('dog_notes')
      .select('*')
      .limit(1)

    if (notesError) {
      console.error('❌ Error fetching notes:', notesError)
      return
    }

    if (notes && notes.length > 0) {
      console.log('📋 dog_notes Schema:')
      const note = notes[0]
      Object.keys(note).forEach(key => {
        console.log(`   ${key}: ${typeof note[key]} = ${JSON.stringify(note[key])}`)
      })
    } else {
      console.log('❌ No notes found in dog_notes table')
    }

    // Try to get notes for Luigi's dog
    const { data: luigiNotes, error: luigiError } = await supabase
      .from('dog_notes')
      .select('*')
      .eq('dog_id', 'c9fe0058-f45f-44b0-bbc5-01b18688684c') // Luigi's ID
      .eq('type', 'stool')

    if (luigiError) {
      console.error('❌ Error fetching Luigi\'s notes:', luigiError)
    } else {
      console.log(`\n📋 Luigi's Stool Notes (${luigiNotes.length} entries):`)
      if (luigiNotes.length > 0) {
        luigiNotes.forEach((note, index) => {
          const date = new Date(note.created_at).toLocaleDateString()
          console.log(`   ${index + 1}. Score ${note.score} - ${date}`)
          console.log(`      Notes: ${note.notes || 'No notes'}`)
        })
      } else {
        console.log('   ❌ No stool notes found for Luigi')
      }
    }

    // Check all notes in the table
    const { data: allNotes, error: allError } = await supabase
      .from('dog_notes')
      .select('*')
      .limit(10)

    if (allError) {
      console.error('❌ Error fetching all notes:', allError)
    } else {
      console.log(`\n📋 All Notes in Table (${allNotes.length} total):`)
      allNotes.forEach((note, index) => {
        const date = new Date(note.created_at).toLocaleDateString()
        console.log(`   ${index + 1}. Type: ${note.type}, Score: ${note.score || 'N/A'}, Date: ${date}`)
        console.log(`      Dog ID: ${note.dog_id}`)
      })
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

checkDogNotesSchema()
