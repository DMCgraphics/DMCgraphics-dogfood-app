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
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkStoolEntriesOwner() {
  console.log('🔍 Checking Stool Entries Owner...\n')

  try {
    // 1. Get the dog with stool entries
    console.log('1. Finding dog with stool entries...')
    const { data: stoolEntries, error: stoolError } = await supabase
      .from('dog_notes')
      .select('dog_id, note, created_at')
      .order('created_at', { ascending: false })

    if (stoolError) {
      console.error('❌ Error fetching stool entries:', stoolError)
      return
    }

    const dogIdWithEntries = stoolEntries[0]?.dog_id
    console.log(`✅ Dog with stool entries: ${dogIdWithEntries}`)

    // 2. Get the dog details
    console.log('\n2. Getting dog details...')
    const { data: dogData, error: dogError } = await supabase
      .from('dogs')
      .select('id, name, user_id, created_at')
      .eq('id', dogIdWithEntries)
      .single()

    if (dogError) {
      console.error('❌ Error fetching dog:', dogError)
      return
    }

    console.log(`✅ Dog details:`)
    console.log(`   Name: ${dogData.name}`)
    console.log(`   ID: ${dogData.id}`)
    console.log(`   User ID: ${dogData.user_id}`)
    console.log(`   Created: ${dogData.created_at}`)

    // 3. Get the user details
    console.log('\n3. Getting user details...')
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, full_name, created_at')
      .eq('id', dogData.user_id)
      .single()

    if (userError) {
      console.error('❌ Error fetching user:', userError)
      return
    }

    console.log(`✅ User details:`)
    console.log(`   Name: ${userData.full_name}`)
    console.log(`   ID: ${userData.id}`)
    console.log(`   Created: ${userData.created_at}`)

    // 4. Check if this user has an active subscription
    console.log('\n4. Checking for active subscription...')
    const { data: subscriptionData, error: subError } = await supabase
      .from('subscriptions')
      .select('id, status, created_at, plan_id')
      .eq('user_id', dogData.user_id)
      .eq('status', 'active')
      .single()

    if (subError) {
      console.log(`   ⚠️  No active subscription found: ${subError.message}`)
    } else {
      console.log(`✅ Active subscription found:`)
      console.log(`   ID: ${subscriptionData.id}`)
      console.log(`   Status: ${subscriptionData.status}`)
      console.log(`   Plan ID: ${subscriptionData.plan_id}`)
      console.log(`   Created: ${subscriptionData.created_at}`)
    }

    // 5. Check all dogs for this user
    console.log('\n5. Checking all dogs for this user...')
    const { data: allUserDogs, error: allDogsError } = await supabase
      .from('dogs')
      .select('id, name, user_id, created_at')
      .eq('user_id', dogData.user_id)
      .order('created_at', { ascending: false })

    if (allDogsError) {
      console.error('❌ Error fetching all user dogs:', allDogsError)
      return
    }

    console.log(`✅ User has ${allUserDogs.length} dogs:`)
    allUserDogs.forEach((dog, index) => {
      const hasStoolEntries = stoolEntries.some(entry => entry.dog_id === dog.id)
      console.log(`   ${index + 1}. ${dog.name} (${dog.id}) - Has stool entries: ${hasStoolEntries ? 'Yes' : 'No'}`)
    })

    // 6. Show all stool entries for this dog
    console.log('\n6. All stool entries for this dog:')
    const dogStoolEntries = stoolEntries.filter(entry => entry.dog_id === dogIdWithEntries)
    dogStoolEntries.forEach((entry, index) => {
      console.log(`   ${index + 1}. ${entry.note} - ${entry.created_at}`)
    })

    console.log('\n🎯 SUMMARY:')
    console.log(`   The stool entries belong to: ${dogData.name} (owned by ${userData.full_name})`)
    console.log(`   If you're logged in as a different user or viewing a different dog, you won't see these entries.`)
    console.log(`   The dashboard should show these entries only when viewing ${dogData.name}.`)

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkStoolEntriesOwner()
