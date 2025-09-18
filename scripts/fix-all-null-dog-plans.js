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

async function fixAllNullDogPlans() {
  console.log('🔧 Fixing All Plans with Null dog_id...\n')

  try {
    // 1. Find all plans with null dog_id
    console.log('1. Finding plans with null dog_id...')
    const { data: nullDogPlans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .is('dog_id', null)
      .order('created_at', { ascending: false })

    if (plansError) {
      console.error('❌ Error fetching plans:', plansError)
      return
    }

    console.log(`✅ Found ${nullDogPlans.length} plans with null dog_id:`)
    nullDogPlans.forEach(plan => {
      console.log(`   - Plan ID: ${plan.id}`)
      console.log(`     User ID: ${plan.user_id}`)
      console.log(`     Status: ${plan.status}`)
      console.log(`     Created: ${plan.created_at}`)
      console.log('')
    })

    if (nullDogPlans.length === 0) {
      console.log('✅ No plans with null dog_id found!')
      return
    }

    // 2. For each plan, try to find the associated dog
    console.log('2. Attempting to fix each plan...')
    let fixedCount = 0
    let failedCount = 0

    for (const plan of nullDogPlans) {
      console.log(`\n🔧 Processing plan ${plan.id}...`)

      try {
        // Try to find dogs for this user
        const { data: userDogs, error: dogsError } = await supabase
          .from('dogs')
          .select('*')
          .eq('user_id', plan.user_id)
          .order('created_at', { ascending: true })

        if (dogsError) {
          console.error(`   ❌ Error fetching dogs for user ${plan.user_id}:`, dogsError)
          failedCount++
          continue
        }

        if (!userDogs || userDogs.length === 0) {
          console.log(`   ⚠️  No dogs found for user ${plan.user_id}`)
          failedCount++
          continue
        }

        // Use the first dog (oldest) as the primary dog for this plan
        const primaryDog = userDogs[0]
        console.log(`   📍 Found primary dog: ${primaryDog.name} (${primaryDog.id})`)

        // Update the plan to link it to the primary dog
        const { data: updateData, error: updateError } = await supabase
          .from('plans')
          .update({ 
            dog_id: primaryDog.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', plan.id)
          .select()

        if (updateError) {
          console.error(`   ❌ Error updating plan ${plan.id}:`, updateError)
          failedCount++
          continue
        }

        console.log(`   ✅ Plan ${plan.id} linked to ${primaryDog.name} (${primaryDog.id})`)
        fixedCount++

      } catch (error) {
        console.error(`   ❌ Unexpected error processing plan ${plan.id}:`, error)
        failedCount++
      }
    }

    console.log('\n🎯 SUMMARY:')
    console.log(`   ✅ Successfully fixed: ${fixedCount} plans`)
    console.log(`   ❌ Failed to fix: ${failedCount} plans`)
    console.log(`   📊 Total processed: ${nullDogPlans.length} plans`)

    if (fixedCount > 0) {
      console.log('\n✅ All fixed plans should now display correctly in the dashboard!')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixAllNullDogPlans()
