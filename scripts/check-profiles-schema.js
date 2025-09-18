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

async function checkProfilesSchema() {
  console.log('🔍 Checking Profiles Table Schema...\n')

  try {
    // 1. Check profiles table structure
    console.log('1. Checking profiles table...')
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError)
      return
    }

    console.log(`✅ Found ${profilesData.length} profiles:`)
    if (profilesData.length > 0) {
      console.log('   Columns:', Object.keys(profilesData[0]))
      profilesData.forEach((profile, index) => {
        console.log(`   ${index + 1}.`, profile)
      })
    }

    // 2. Check auth.users table (if accessible)
    console.log('\n2. Checking auth.users table...')
    const { data: authUsersData, error: authError } = await supabase
      .from('auth.users')
      .select('*')
      .limit(5)
      .catch(() => ({ data: null, error: { message: 'Cannot access auth.users directly' } }))

    if (authError) {
      console.log(`   ⚠️  Cannot access auth.users: ${authError.message}`)
    } else if (authUsersData) {
      console.log(`✅ Found ${authUsersData.length} auth users:`)
      if (authUsersData.length > 0) {
        console.log('   Columns:', Object.keys(authUsersData[0]))
        authUsersData.forEach((user, index) => {
          console.log(`   ${index + 1}.`, user)
        })
      }
    }

    // 3. Check recent dogs with their user info
    console.log('\n3. Checking recent dogs...')
    const { data: dogsData, error: dogsError } = await supabase
      .from('dogs')
      .select('id, name, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (dogsError) {
      console.error('❌ Error fetching dogs:', dogsError)
      return
    }

    console.log(`✅ Found ${dogsData.length} recent dogs:`)
    dogsData.forEach((dog, index) => {
      console.log(`   ${index + 1}. ${dog.name} (ID: ${dog.id}, User: ${dog.user_id}) - Created: ${dog.created_at}`)
    })

    // 4. Check which dogs have stool entries
    console.log('\n4. Checking dogs with stool entries...')
    const { data: stoolEntries, error: stoolError } = await supabase
      .from('dog_notes')
      .select('dog_id, note, created_at')
      .order('created_at', { ascending: false })

    if (stoolError) {
      console.error('❌ Error fetching stool entries:', stoolError)
      return
    }

    const dogStoolMap = new Map()
    stoolEntries.forEach(entry => {
      if (!dogStoolMap.has(entry.dog_id)) {
        dogStoolMap.set(entry.dog_id, [])
      }
      dogStoolMap.get(entry.dog_id).push(entry)
    })

    console.log(`✅ Found ${stoolEntries.length} stool entries across ${dogStoolMap.size} dogs:`)
    dogStoolMap.forEach((entries, dogId) => {
      const dog = dogsData.find(d => d.id === dogId)
      console.log(`\n   Dog: ${dog ? dog.name : 'Unknown'} (${dogId})`)
      console.log(`   Owner User ID: ${dog ? dog.user_id : 'Unknown'}`)
      console.log(`   Entries: ${entries.length}`)
      entries.forEach((entry, index) => {
        console.log(`     ${index + 1}. ${entry.note} - ${entry.created_at}`)
      })
    })

    // 5. Check active subscriptions
    console.log('\n5. Checking active subscriptions...')
    const { data: activeSubs, error: subsError } = await supabase
      .from('subscriptions')
      .select('user_id, status, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (subsError) {
      console.error('❌ Error fetching subscriptions:', subsError)
      return
    }

    console.log(`✅ Found ${activeSubs.length} active subscriptions:`)
    activeSubs.forEach(sub => {
      console.log(`   - User: ${sub.user_id} - Created: ${sub.created_at}`)
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkProfilesSchema()
