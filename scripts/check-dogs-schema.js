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

async function checkDogsSchema() {
  console.log('🔍 Checking Dogs Table Schema...\n')

  try {
    // 1. Check dogs table structure
    console.log('1. Checking dogs table...')
    const { data: dogsData, error: dogsError } = await supabase
      .from('dogs')
      .select('*')
      .limit(3)

    if (dogsError) {
      console.error('❌ Error fetching dogs:', dogsError)
      return
    }

    console.log(`✅ Found ${dogsData.length} dogs:`)
    if (dogsData.length > 0) {
      console.log('   Columns:', Object.keys(dogsData[0]))
      dogsData.forEach((dog, index) => {
        console.log(`   ${index + 1}.`, {
          id: dog.id,
          name: dog.name,
          breed: dog.breed,
          weight: dog.weight,
          weight_unit: dog.weight_unit,
          avatar_url: dog.avatar_url,
          user_id: dog.user_id
        })
      })
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkDogsSchema()
