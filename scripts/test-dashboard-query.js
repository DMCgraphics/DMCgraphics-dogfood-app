#!/usr/bin/env node

/**
 * Test the exact dashboard query
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testDashboardQuery() {
  console.log('🧪 Testing Dashboard Query...\n')

  try {
    // This is the exact query from the dashboard
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        plan:plans (
          *,
          plan_items (
            *,
            recipes (
              name
            )
          )
        )
      `)
      .eq('user_id', '54425ad2-2939-48b2-9ffa-1cff716ea943')
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError)
      return
    }

    console.log(`📋 Dashboard Query Results (${ordersData.length} orders):`)
    
    for (const order of ordersData) {
      console.log(`\nOrder: ${order.id}`)
      console.log(`   Status: ${order.status}`)
      console.log(`   Total: $${order.total}`)
      
      if (order.plan) {
        console.log(`   ✅ Plan found: ${order.plan.id}`)
        console.log(`   Plan Items: ${order.plan.plan_items?.length || 0}`)
        
        if (order.plan.plan_items && order.plan.plan_items.length > 0) {
          order.plan.plan_items.forEach((item, index) => {
            console.log(`      ${index + 1}. ${JSON.stringify(item, null, 2)}`)
          })
        }
      } else {
        console.log(`   ❌ No plan data`)
      }
    }

    // Test the mapping logic
    console.log('\n🧪 Testing Dashboard Mapping Logic:')
    const realDeliveries = (ordersData || []).map((order) => {
      console.log(`\nProcessing order: ${order.id}`)
      
      const items = order.plan?.plan_items?.map((item) => {
        console.log(`   Processing item: ${JSON.stringify(item, null, 2)}`)
        
        if (item.recipes) {
          const result = `${item.recipes.name} (${item.qty || 1} weeks)`
          console.log(`   ✅ Using recipes.name: ${result}`)
          return result
        } else if (item.name) {
          const result = item.name
          console.log(`   ✅ Using item.name: ${result}`)
          return result
        } else {
          console.log(`   ❌ No recipe or name found`)
          return 'Unknown Item'
        }
      }) || []
      
      console.log(`   Final items: ${JSON.stringify(items)}`)
      
      return {
        id: order.id,
        date: order.created_at,
        status: order.status === "completed" ? "delivered" : "upcoming",
        items: items,
      }
    })

    console.log(`\n📋 Final Deliveries Array:`)
    realDeliveries.forEach((delivery, index) => {
      console.log(`   ${index + 1}. ${delivery.id}`)
      console.log(`      Date: ${delivery.date}`)
      console.log(`      Status: ${delivery.status}`)
      console.log(`      Items: ${delivery.items.join(', ')}`)
    })

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testDashboardQuery()
