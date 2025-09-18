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

async function cleanupOrphanedPlan() {
  console.log('🧹 Cleaning up orphaned plan...\n')

  try {
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

    // Check if this plan has any related data
    console.log('\n2. Checking for related data...')
    
    // Check plan_items
    const { data: planItems, error: itemsError } = await supabase
      .from('plan_items')
      .select('*')
      .eq('plan_id', planId)

    if (itemsError) {
      console.error('❌ Error fetching plan items:', itemsError)
      return
    }

    console.log(`   Plan items: ${planItems.length}`)

    // Check subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('plan_id', planId)

    if (subsError) {
      console.error('❌ Error fetching subscriptions:', subsError)
      return
    }

    console.log(`   Subscriptions: ${subscriptions.length}`)

    // Check orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('plan_id', planId)

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError)
      return
    }

    console.log(`   Orders: ${orders.length}`)

    // If the plan has no user_id, dog_id, subscriptions, or orders, it's safe to delete
    if (!planData.user_id && !planData.dog_id && subscriptions.length === 0 && orders.length === 0) {
      console.log('\n3. Plan appears to be orphaned (no user, dog, subscriptions, or orders)')
      console.log('   Proceeding to delete...')

      // Delete plan_items first (foreign key constraint)
      if (planItems.length > 0) {
        console.log('   Deleting plan items...')
        const { error: deleteItemsError } = await supabase
          .from('plan_items')
          .delete()
          .eq('plan_id', planId)

        if (deleteItemsError) {
          console.error('❌ Error deleting plan items:', deleteItemsError)
          return
        }
        console.log('   ✅ Plan items deleted')
      }

      // Delete the plan
      console.log('   Deleting plan...')
      const { error: deletePlanError } = await supabase
        .from('plans')
        .delete()
        .eq('id', planId)

      if (deletePlanError) {
        console.error('❌ Error deleting plan:', deletePlanError)
        return
      }

      console.log('   ✅ Plan deleted successfully')
      console.log('\n🎯 SUMMARY:')
      console.log('   ✅ Orphaned plan cleaned up')
      console.log('   ✅ Database is now clean')
    } else {
      console.log('\n⚠️  Plan has related data, not deleting')
      console.log('   This plan should be investigated manually')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

cleanupOrphanedPlan()
