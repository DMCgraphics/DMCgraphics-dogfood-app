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

async function fixLuigiPlan() {
  console.log('🔧 Fixing Luigi\'s Plan...\n')

  try {
    const planId = 'b794c176-4186-415f-87a7-8bc4a8be8af6'
    const userId = '54425ad2-2939-48b2-9ffa-1cff716ea943' // Dylan Cohen
    
    console.log(`1. Finding Luigi for user ${userId}...`)
    const { data: dogsData, error: dogsError } = await supabase
      .from('dogs')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', '%Luigi%')
      .order('created_at', { ascending: true })

    if (dogsError) {
      console.error('❌ Error fetching dogs:', dogsError)
      return
    }

    if (!dogsData || dogsData.length === 0) {
      console.log('❌ No dogs found for user')
      return
    }

    const luigi = dogsData[0]
    console.log(`✅ Found Luigi: ${luigi.name} (${luigi.id})`)

    console.log('\n2. Updating plan to link to Luigi...')
    const { data: updateData, error: updateError } = await supabase
      .from('plans')
      .update({ 
        user_id: userId,
        dog_id: luigi.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', planId)
      .select()

    if (updateError) {
      console.error('❌ Error updating plan:', updateError)
      return
    }

    console.log('✅ Plan updated successfully!')
    console.log(`   Plan ID: ${updateData[0].id}`)
    console.log(`   User ID: ${updateData[0].user_id}`)
    console.log(`   Dog ID: ${updateData[0].dog_id}`)
    console.log(`   Status: ${updateData[0].status}`)

    console.log('\n🎯 SUMMARY:')
    console.log(`   ✅ Plan ${planId} is now linked to Luigi (${luigi.id})`)
    console.log(`   ✅ Plan is now linked to Dylan Cohen (${userId})`)
    console.log(`   ✅ Dashboard should now show Luigi's recipe and subscription status`)

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixLuigiPlan()
