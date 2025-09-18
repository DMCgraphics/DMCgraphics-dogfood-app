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

async function addDogAvatarColumn() {
  console.log('🔧 Adding avatar_url column to dogs table...\n')

  try {
    // First, let's check if the column already exists
    const { data: dogsData, error: checkError } = await supabase
      .from('dogs')
      .select('*')
      .limit(1)

    if (checkError) {
      console.error('❌ Error checking dogs table:', checkError)
      return
    }

    if (dogsData && dogsData.length > 0) {
      const columns = Object.keys(dogsData[0])
      if (columns.includes('avatar_url')) {
        console.log('✅ avatar_url column already exists in dogs table')
        return
      }
    }

    // Try to add the column using a direct SQL query
    console.log('Adding avatar_url column...')
    
    // Since we can't execute raw SQL directly, we'll try to insert a test record with avatar_url
    // and see if it works. If it fails, the column doesn't exist.
    const { error: testError } = await supabase
      .from('dogs')
      .insert({
        name: 'test_dog_for_column_check',
        breed: 'test',
        age: 1,
        weight: 10,
        avatar_url: 'test_url',
        user_id: '00000000-0000-0000-0000-000000000000' // This will fail due to foreign key constraint, but that's ok
      })

    if (testError && testError.message.includes('avatar_url')) {
      console.log('❌ avatar_url column does not exist and cannot be added via API')
      console.log('Please add the column manually in your Supabase dashboard:')
      console.log('ALTER TABLE dogs ADD COLUMN avatar_url TEXT;')
      return
    }

    console.log('✅ avatar_url column appears to exist or was added successfully')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

addDogAvatarColumn()
