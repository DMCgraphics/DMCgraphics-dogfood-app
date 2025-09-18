const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local if it exists
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  const envLines = envContent.split('\n')
  
  envLines.forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim()
      if (value && !process.env[key]) {
        process.env[key] = value
      }
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tczvietgpixwonpqaotl.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugStoolLogData() {
  console.log('🔍 Debugging Stool Log Data Fetching...\n')

  try {
    // 1. Check all dogs
    console.log('1. Fetching all dogs...')
    const { data: dogsData, error: dogsError } = await supabase
      .from('dogs')
      .select('id, name, user_id')
      .order('created_at', { ascending: false })

    if (dogsError) {
      console.error('❌ Error fetching dogs:', dogsError)
      return
    }

    console.log(`✅ Found ${dogsData.length} dogs:`)
    dogsData.forEach(dog => {
      console.log(`   - ${dog.name} (ID: ${dog.id}, User: ${dog.user_id})`)
    })

    // 2. Check all dog_notes entries
    console.log('\n2. Fetching all dog_notes entries...')
    const { data: allNotesData, error: allNotesError } = await supabase
      .from('dog_notes')
      .select('*')
      .order('created_at', { ascending: false })

    if (allNotesError) {
      console.error('❌ Error fetching all dog_notes:', allNotesError)
      return
    }

    console.log(`✅ Found ${allNotesData.length} dog_notes entries:`)
    allNotesData.forEach(note => {
      console.log(`   - ID: ${note.id}`)
      console.log(`     Dog ID: ${note.dog_id}`)
      console.log(`     Note: ${note.note}`)
      console.log(`     Created: ${note.created_at}`)
      console.log('')
    })

    // 3. Check which dogs have notes
    console.log('3. Checking which dogs have notes...')
    const dogIdsWithNotes = [...new Set(allNotesData.map(note => note.dog_id))]
    console.log(`✅ Dogs with notes: ${dogIdsWithNotes.length}`)
    
    dogIdsWithNotes.forEach(dogId => {
      const dog = dogsData.find(d => d.id === dogId)
      const notesCount = allNotesData.filter(note => note.dog_id === dogId).length
      console.log(`   - ${dog ? dog.name : 'Unknown'} (${dogId}): ${notesCount} notes`)
    })

    // 4. Simulate the dashboard query for each dog
    console.log('\n4. Simulating dashboard queries...')
    for (const dog of dogsData) {
      console.log(`\n   Testing query for ${dog.name} (${dog.id}):`)
      
      const { data: stoolEntriesData, error: stoolError } = await supabase
        .from("dog_notes")
        .select("*")
        .in("dog_id", [dog.id])
        .order("created_at", { ascending: false })
        .limit(10)

      if (stoolError) {
        console.error(`     ❌ Error: ${stoolError.message}`)
        continue
      }

      console.log(`     ✅ Found ${stoolEntriesData.length} entries`)
      
      if (stoolEntriesData.length > 0) {
        const realStoolEntries = stoolEntriesData.map((entry) => {
          const scoreMatch = entry.note?.match(/Score (\d+)/i)
          const score = scoreMatch ? parseInt(scoreMatch[1]) : 4
          
          return {
            date: entry.created_at.split('T')[0],
            score: score,
            notes: entry.note || "",
          }
        })
        
        console.log(`     📊 Processed entries:`)
        realStoolEntries.forEach((entry, index) => {
          console.log(`       ${index + 1}. Score ${entry.score} - ${entry.date}`)
        })
      } else {
        console.log(`     📭 No entries found (should show empty state)`)
      }
    }

    // 5. Check if there are any RLS policies affecting dog_notes
    console.log('\n5. Checking RLS policies on dog_notes...')
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_rls_policies', { table_name: 'dog_notes' })
      .catch(() => ({ data: null, error: { message: 'RPC function not available' } }))

    if (policiesError) {
      console.log(`   ⚠️  Could not check RLS policies: ${policiesError.message}`)
    } else if (policies) {
      console.log(`   ✅ RLS policies: ${JSON.stringify(policies, null, 2)}`)
    } else {
      console.log(`   ℹ️  No RLS policies found or function not available`)
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

debugStoolLogData()
