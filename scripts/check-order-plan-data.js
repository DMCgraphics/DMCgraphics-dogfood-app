#!/usr/bin/env node

/**
 * Check if the order has proper plan data
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkOrderPlanData() {
  console.log('🔍 Checking Order Plan Data...\n')

  try {
    // Get the order with plan data (same query as dashboard)
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

    console.log(`📋 Found ${ordersData.length} orders with plan data:`)
    
    for (const order of ordersData) {
      const createdTime = new Date(order.created_at)
      const timeAgo = Math.round((Date.now() - createdTime.getTime()) / (1000 * 60)) // minutes ago
      
      console.log(`\n${order.id} - ${timeAgo} minutes ago`)
      console.log(`   Order Number: ${order.order_number}`)
      console.log(`   Status: ${order.status}`)
      console.log(`   Total: $${order.total}`)
      
      if (order.plan) {
        console.log(`   ✅ Plan found:`)
        console.log(`      Plan ID: ${order.plan.id}`)
        console.log(`      Dog ID: ${order.plan.dog_id}`)
        console.log(`      Status: ${order.plan.status}`)
        
        if (order.plan.plan_items && order.plan.plan_items.length > 0) {
          console.log(`      Plan Items (${order.plan.plan_items.length}):`)
          order.plan.plan_items.forEach((item, index) => {
            console.log(`         ${index + 1}. ${item.recipes?.name || 'Unknown Recipe'} (${item.qty || 1} weeks)`)
          })
        } else {
          console.log(`      ❌ No plan items found`)
        }
      } else {
        console.log(`   ❌ No plan data found`)
      }
    }

    // Test the dashboard's delivery mapping logic
    console.log('\n🧪 Testing Dashboard Delivery Mapping:')
    const realDeliveries = (ordersData || []).map((order) => ({
      id: order.id,
      date: order.created_at,
      status: order.status === "completed" ? "delivered" : "upcoming",
      items: order.plan?.plan_items?.map((item) => 
        item.recipe ? `${item.recipe.name} (${item.qty || 1} weeks)` : item.name
      ) || [],
    }))

    console.log(`   Mapped ${realDeliveries.length} deliveries:`)
    realDeliveries.forEach((delivery, index) => {
      console.log(`   ${index + 1}. ${delivery.id}`)
      console.log(`      Date: ${delivery.date}`)
      console.log(`      Status: ${delivery.status}`)
      console.log(`      Items: ${delivery.items.join(', ')}`)
    })

  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

checkOrderPlanData()
