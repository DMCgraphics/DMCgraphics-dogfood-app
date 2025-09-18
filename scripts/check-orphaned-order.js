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

async function checkOrphanedOrder() {
  console.log('🔍 Checking orphaned order...\n')

  try {
    const planId = 'b794c176-4186-415f-87a7-8bc4a8be8af6'
    
    console.log(`1. Checking order for plan ${planId}...`)
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('plan_id', planId)

    if (orderError) {
      console.error('❌ Error fetching order:', orderError)
      return
    }

    console.log(`✅ Found ${orderData.length} orders:`)
    orderData.forEach(order => {
      console.log(`   - Order ID: ${order.id}`)
      console.log(`     User ID: ${order.user_id}`)
      console.log(`     Plan ID: ${order.plan_id}`)
      console.log(`     Status: ${order.status}`)
      console.log(`     Created: ${order.created_at}`)
      console.log('')
    })

    // If the order also has null user_id, it's safe to delete both
    if (orderData.length === 1 && !orderData[0].user_id) {
      console.log('2. Order also has null user_id - both are orphaned')
      console.log('   Proceeding to delete order and plan...')

      // Delete the order first
      const { error: deleteOrderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderData[0].id)

      if (deleteOrderError) {
        console.error('❌ Error deleting order:', deleteOrderError)
        return
      }

      console.log('   ✅ Order deleted')

      // Delete the plan
      const { error: deletePlanError } = await supabase
        .from('plans')
        .delete()
        .eq('id', planId)

      if (deletePlanError) {
        console.error('❌ Error deleting plan:', deletePlanError)
        return
      }

      console.log('   ✅ Plan deleted')
      console.log('\n🎯 SUMMARY:')
      console.log('   ✅ Orphaned order and plan cleaned up')
      console.log('   ✅ Database is now clean')
    } else {
      console.log('⚠️  Order has valid user_id, not deleting')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkOrphanedOrder()
