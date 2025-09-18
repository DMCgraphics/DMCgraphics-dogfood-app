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

async function checkCurrentUserDog() {
  console.log('🔍 Checking Current User and Dog Selection...\n')

  try {
    // 1. Check recent users (last 10)
    console.log('1. Checking recent users...')
    const { data: recentUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }

    console.log(`✅ Found ${recentUsers.length} recent users:`)
    recentUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (ID: ${user.id}) - Created: ${user.created_at}`)
    })

    // 2. Check which users have dogs
    console.log('\n2. Checking users with dogs...')
    const { data: usersWithDogs, error: dogsError } = await supabase
      .from('dogs')
      .select('user_id, name, id, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    if (dogsError) {
      console.error('❌ Error fetching dogs:', dogsError)
      return
    }

    console.log(`✅ Found ${usersWithDogs.length} recent dogs:`)
    const userDogMap = new Map()
    usersWithDogs.forEach(dog => {
      if (!userDogMap.has(dog.user_id)) {
        userDogMap.set(dog.user_id, [])
      }
      userDogMap.get(dog.user_id).push(dog)
    })

    userDogMap.forEach((dogs, userId) => {
      const user = recentUsers.find(u => u.id === userId)
      console.log(`\n   User: ${user ? user.email : 'Unknown'} (${userId})`)
      dogs.forEach(dog => {
        console.log(`     - ${dog.name} (ID: ${dog.id}) - Created: ${dog.created_at}`)
      })
    })

    // 3. Check which dogs have stool entries
    console.log('\n3. Checking dogs with stool entries...')
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
      const dog = usersWithDogs.find(d => d.id === dogId)
      const user = recentUsers.find(u => u.id === dog?.user_id)
      console.log(`\n   Dog: ${dog ? dog.name : 'Unknown'} (${dogId})`)
      console.log(`   Owner: ${user ? user.email : 'Unknown'}`)
      console.log(`   Entries: ${entries.length}`)
      entries.forEach((entry, index) => {
        console.log(`     ${index + 1}. ${entry.note} - ${entry.created_at}`)
      })
    })

    // 4. Check which users have active subscriptions
    console.log('\n4. Checking users with active subscriptions...')
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
      const user = recentUsers.find(u => u.id === sub.user_id)
      console.log(`   - ${user ? user.email : 'Unknown'} (${sub.user_id}) - Created: ${sub.created_at}`)
    })

    // 5. Find the most likely current user
    console.log('\n5. Most likely current user analysis:')
    const mostRecentUser = recentUsers[0]
    const mostRecentUserDogs = userDogMap.get(mostRecentUser.id) || []
    const mostRecentUserHasStoolEntries = mostRecentUserDogs.some(dog => dogStoolMap.has(dog.id))
    const mostRecentUserHasActiveSub = activeSubs.some(sub => sub.user_id === mostRecentUser.id)

    console.log(`   Most recent user: ${mostRecentUser.email} (${mostRecentUser.id})`)
    console.log(`   Has dogs: ${mostRecentUserDogs.length > 0 ? 'Yes' : 'No'} (${mostRecentUserDogs.length} dogs)`)
    console.log(`   Has stool entries: ${mostRecentUserHasStoolEntries ? 'Yes' : 'No'}`)
    console.log(`   Has active subscription: ${mostRecentUserHasActiveSub ? 'Yes' : 'No'}`)

    if (mostRecentUserDogs.length > 0) {
      console.log(`   Dogs:`)
      mostRecentUserDogs.forEach(dog => {
        const hasStoolEntries = dogStoolMap.has(dog.id)
        const stoolCount = hasStoolEntries ? dogStoolMap.get(dog.id).length : 0
        console.log(`     - ${dog.name} (${dog.id}) - Stool entries: ${stoolCount}`)
      })
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkCurrentUserDog()
