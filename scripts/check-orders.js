#!/usr/bin/env node

/**
 * Check if orders are being created
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkOrders() {
  console.log('🔍 Checking Orders...\n')

  try {
    // Get all orders
    const { data: allOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError)
      return
    }

    console.log(`📋 Found ${allOrders.length} orders:`)
    
    for (const order of allOrders) {
      const createdTime = new Date(order.created_at)
      const timeAgo = Math.round((Date.now() - createdTime.getTime()) / (1000 * 60)) // minutes ago
      
      console.log(`\n${order.id} - ${timeAgo} minutes ago`)
      console.log(`   Order Number: ${order.order_number}`)
      console.log(`   User ID: ${order.user_id}`)
      console.log(`   Plan ID: ${order.plan_id}`)
      console.log(`   Status: ${order.status}`)
      console.log(`   Total: $${order.total}`)
      console.log(`   Stripe Subscription ID: ${order.stripe_subscription_id}`)
    }

    if (allOrders.length === 0) {
      console.log('\n❌ No orders found!')
      console.log('This means the webhook is not creating orders properly.')
      console.log('The dashboard will fall back to mock delivery data.')
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

checkOrders()
