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

async function debugMabelData() {
  console.log('🔍 Debugging Mabel\'s Data...\n')

  try {
    // 1. Find Bri Garus user
    console.log('1. Finding Bri Garus user...')
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .ilike('full_name', '%Bri%')

    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }

    console.log(`✅ Found ${usersData.length} users matching "Bri":`)
    usersData.forEach(user => {
      console.log(`   - ${user.full_name} (ID: ${user.id})`)
    })

    if (usersData.length === 0) {
      console.log('❌ No users found matching "Bri"')
      return
    }

    const briUser = usersData[0]
    console.log(`\n   Using user: ${briUser.full_name} (${briUser.id})`)

    // 2. Find Mabel
    console.log('\n2. Finding Mabel...')
    const { data: dogsData, error: dogsError } = await supabase
      .from('dogs')
      .select('*')
      .eq('user_id', briUser.id)
      .ilike('name', '%Mabel%')

    if (dogsError) {
      console.error('❌ Error fetching dogs:', dogsError)
      return
    }

    console.log(`✅ Found ${dogsData.length} dogs matching "Mabel":`)
    dogsData.forEach(dog => {
      console.log(`   - ${dog.name} (ID: ${dog.id}, User: ${dog.user_id})`)
    })

    if (dogsData.length === 0) {
      console.log('❌ No dogs found matching "Mabel"')
      return
    }

    const mabel = dogsData[0]
    console.log(`\n   Using dog: ${mabel.name} (${mabel.id})`)

    // 3. Check plans for Mabel
    console.log('\n3. Checking plans for Mabel...')
    const { data: plansData, error: plansError } = await supabase
      .from('plans')
      .select(`
        *,
        plan_items (
          *,
          recipes (name)
        )
      `)
      .eq('user_id', briUser.id)
      .order('created_at', { ascending: false })

    if (plansError) {
      console.error('❌ Error fetching plans:', plansError)
      return
    }

    console.log(`✅ Found ${plansData.length} plans for user:`)
    plansData.forEach(plan => {
      console.log(`   - Plan ID: ${plan.id}`)
      console.log(`     Dog ID: ${plan.dog_id}`)
      console.log(`     Status: ${plan.status}`)
      console.log(`     Created: ${plan.created_at}`)
      if (plan.plan_items && plan.plan_items.length > 0) {
        console.log(`     Items: ${plan.plan_items.length}`)
        plan.plan_items.forEach(item => {
          console.log(`       - ${item.recipes?.name || 'No recipe name'} (Qty: ${item.qty})`)
        })
      }
      console.log('')
    })

    // 4. Check if any plan is linked to Mabel
    const mabelPlan = plansData.find(plan => plan.dog_id === mabel.id)
    if (mabelPlan) {
      console.log(`✅ Found plan for Mabel:`)
      console.log(`   Plan ID: ${mabelPlan.id}`)
      console.log(`   Status: ${mabelPlan.status}`)
      console.log(`   Created: ${mabelPlan.created_at}`)
    } else {
      console.log(`❌ No plan found for Mabel (dog_id: ${mabel.id})`)
    }

    // 5. Check subscriptions
    console.log('\n4. Checking subscriptions...')
    const { data: subscriptionsData, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', briUser.id)
      .order('created_at', { ascending: false })

    if (subsError) {
      console.error('❌ Error fetching subscriptions:', subsError)
      return
    }

    console.log(`✅ Found ${subscriptionsData.length} subscriptions for user:`)
    subscriptionsData.forEach(sub => {
      console.log(`   - Subscription ID: ${sub.id}`)
      console.log(`     Plan ID: ${sub.plan_id}`)
      console.log(`     Status: ${sub.status}`)
      console.log(`     Created: ${sub.created_at}`)
      console.log(`     Current Period End: ${sub.current_period_end}`)
      console.log('')
    })

    // 6. Check if subscription is linked to Mabel's plan
    if (mabelPlan) {
      const mabelSubscription = subscriptionsData.find(sub => sub.plan_id === mabelPlan.id)
      if (mabelSubscription) {
        console.log(`✅ Found subscription for Mabel's plan:`)
        console.log(`   Subscription ID: ${mabelSubscription.id}`)
        console.log(`   Status: ${mabelSubscription.status}`)
        console.log(`   Plan ID: ${mabelSubscription.plan_id}`)
      } else {
        console.log(`❌ No subscription found for Mabel's plan (plan_id: ${mabelPlan.id})`)
      }
    }

    // 7. Check recent orders
    console.log('\n5. Checking recent orders...')
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        plan:plans (
          *,
          plan_items (
            *,
            recipes (name)
          )
        )
      `)
      .eq('user_id', briUser.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError)
      return
    }

    console.log(`✅ Found ${ordersData.length} recent orders:`)
    ordersData.forEach(order => {
      console.log(`   - Order ID: ${order.id}`)
      console.log(`     Plan ID: ${order.plan_id}`)
      console.log(`     Status: ${order.status}`)
      console.log(`     Created: ${order.created_at}`)
      if (order.plan) {
        console.log(`     Plan Dog ID: ${order.plan.dog_id}`)
        console.log(`     Plan Status: ${order.plan.status}`)
      }
      console.log('')
    })

    console.log('\n🎯 SUMMARY:')
    console.log(`   User: ${briUser.full_name} (${briUser.id})`)
    console.log(`   Dog: ${mabel.name} (${mabel.id})`)
    console.log(`   Plan: ${mabelPlan ? `Found (${mabelPlan.id}, status: ${mabelPlan.status})` : 'Not found'}`)
    console.log(`   Subscription: ${mabelPlan ? (subscriptionsData.find(sub => sub.plan_id === mabelPlan.id) ? 'Found' : 'Not found') : 'N/A'}`)

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

debugMabelData()
