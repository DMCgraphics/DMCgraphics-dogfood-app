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

async function fixMabelPlanLinking() {
  console.log('🔧 Fixing Mabel\'s Plan Linking...\n')

  try {
    // 1. Get Bri Garus user
    const { data: usersData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .ilike('full_name', '%Bri%')

    if (!usersData || usersData.length === 0) {
      console.log('❌ No users found matching "Bri"')
      return
    }

    const briUser = usersData[0]
    console.log(`✅ Found user: ${briUser.full_name} (${briUser.id})`)

    // 2. Get Mabel
    const { data: dogsData } = await supabase
      .from('dogs')
      .select('*')
      .eq('user_id', briUser.id)
      .ilike('name', '%Mabel%')

    if (!dogsData || dogsData.length === 0) {
      console.log('❌ No dogs found matching "Mabel"')
      return
    }

    const mabel = dogsData[0]
    console.log(`✅ Found dog: ${mabel.name} (${mabel.id})`)

    // 3. Get the plan with null dog_id
    const { data: plansData } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', briUser.id)
      .is('dog_id', null)

    if (!plansData || plansData.length === 0) {
      console.log('❌ No plans found with null dog_id')
      return
    }

    const plan = plansData[0]
    console.log(`✅ Found plan with null dog_id: ${plan.id}`)

    // 4. Update the plan to link it to Mabel
    console.log(`\n🔧 Updating plan ${plan.id} to link to Mabel (${mabel.id})...`)
    
    const { data: updateData, error: updateError } = await supabase
      .from('plans')
      .update({ 
        dog_id: mabel.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', plan.id)
      .select()

    if (updateError) {
      console.error('❌ Error updating plan:', updateError)
      return
    }

    console.log('✅ Plan updated successfully!')
    console.log(`   Plan ID: ${updateData[0].id}`)
    console.log(`   Dog ID: ${updateData[0].dog_id}`)
    console.log(`   Status: ${updateData[0].status}`)

    // 5. Verify the fix
    console.log('\n🔍 Verifying the fix...')
    const { data: verifyData } = await supabase
      .from('plans')
      .select(`
        *,
        plan_items (
          *,
          recipes (name)
        )
      `)
      .eq('id', plan.id)
      .single()

    if (verifyData) {
      console.log('✅ Verification successful:')
      console.log(`   Plan ID: ${verifyData.id}`)
      console.log(`   Dog ID: ${verifyData.dog_id}`)
      console.log(`   Status: ${verifyData.status}`)
      console.log(`   Recipe: ${verifyData.plan_items?.[0]?.recipes?.name || 'No recipe'}`)
    }

    console.log('\n🎯 SUMMARY:')
    console.log(`   ✅ Plan ${plan.id} is now linked to Mabel (${mabel.id})`)
    console.log(`   ✅ Dashboard should now show Mabel's recipe and subscription status`)
    console.log(`   ✅ Next delivery should be calculated from subscription data`)

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixMabelPlanLinking()
