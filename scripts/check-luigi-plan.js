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

async function checkLuigiPlan() {
  console.log('🔍 Checking Luigi\'s Plan...\n')

  try {
    // Check the specific plan ID
    const planId = 'b794c176-4186-415f-87a7-8bc4a8be8af6'
    
    console.log(`1. Checking plan ${planId}...`)
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError) {
      console.error('❌ Error fetching plan:', planError)
      return
    }

    console.log('✅ Plan found:')
    console.log(`   Plan ID: ${planData.id}`)
    console.log(`   User ID: ${planData.user_id}`)
    console.log(`   Dog ID: ${planData.dog_id}`)
    console.log(`   Status: ${planData.status}`)
    console.log(`   Created: ${planData.created_at}`)

    // Check if there are any subscriptions for this plan
    console.log('\n2. Checking subscriptions for this plan...')
    const { data: subsData, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('plan_id', planId)

    if (subsError) {
      console.error('❌ Error fetching subscriptions:', subsError)
      return
    }

    console.log(`✅ Found ${subsData.length} subscriptions:`)
    subsData.forEach(sub => {
      console.log(`   - Subscription ID: ${sub.id}`)
      console.log(`     Status: ${sub.status}`)
      console.log(`     User ID: ${sub.user_id}`)
      console.log(`     Created: ${sub.created_at}`)
    })

    // If the plan has a valid user_id, check if it's linked to a dog
    if (planData.user_id && planData.user_id !== 'null') {
      console.log('\n3. Checking dogs for this user...')
      const { data: dogsData, error: dogsError } = await supabase
        .from('dogs')
        .select('*')
        .eq('user_id', planData.user_id)
        .order('created_at', { ascending: true })

      if (dogsError) {
        console.error('❌ Error fetching dogs:', dogsError)
        return
      }

      console.log(`✅ Found ${dogsData.length} dogs for user ${planData.user_id}:`)
      dogsData.forEach(dog => {
        console.log(`   - ${dog.name} (${dog.id}) - Created: ${dog.created_at}`)
      })

      // If the plan doesn't have a dog_id, suggest linking it to the first dog
      if (!planData.dog_id && dogsData.length > 0) {
        console.log('\n🔧 Plan needs to be linked to a dog...')
        const firstDog = dogsData[0]
        console.log(`   Suggesting to link to: ${firstDog.name} (${firstDog.id})`)
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkLuigiPlan()
