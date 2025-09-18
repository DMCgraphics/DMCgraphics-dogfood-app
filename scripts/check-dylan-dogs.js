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

async function checkDylanDogs() {
  console.log('🔍 Checking Dylan Cohen\'s Dogs...\n')

  try {
    const userId = '54425ad2-2939-48b2-9ffa-1cff716ea943' // Dylan Cohen
    
    console.log(`1. Finding all dogs for user ${userId}...`)
    const { data: dogsData, error: dogsError } = await supabase
      .from('dogs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (dogsError) {
      console.error('❌ Error fetching dogs:', dogsError)
      return
    }

    console.log(`✅ Found ${dogsData.length} dogs for Dylan Cohen:`)
    dogsData.forEach((dog, index) => {
      console.log(`   ${index + 1}. ${dog.name} (${dog.id})`)
      console.log(`      Breed: ${dog.breed}`)
      console.log(`      Age: ${dog.age} years`)
      console.log(`      Weight: ${dog.weight} ${dog.weight_unit}`)
      console.log(`      Created: ${dog.created_at}`)
      console.log('')
    })

    // Check if any of these dogs have plans
    console.log('2. Checking plans for these dogs...')
    for (const dog of dogsData) {
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('dog_id', dog.id)

      if (planError) {
        console.error(`❌ Error fetching plan for ${dog.name}:`, planError)
        continue
      }

      if (planData && planData.length > 0) {
        console.log(`   ✅ ${dog.name} has ${planData.length} plan(s):`)
        planData.forEach(plan => {
          console.log(`      - Plan ID: ${plan.id}`)
          console.log(`        Status: ${plan.status}`)
          console.log(`        Created: ${plan.created_at}`)
        })
      } else {
        console.log(`   ❌ ${dog.name} has no plans`)
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkDylanDogs()
