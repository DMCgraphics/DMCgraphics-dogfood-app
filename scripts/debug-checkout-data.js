#!/usr/bin/env node

// Script to debug checkout data for a specific user
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugCheckoutData() {
  console.log('🔍 Debugging checkout data...\n')

  try {
    // Get the current user
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching users:', authError)
      return
    }

    const user = authUsers.users.find(u => u.email === 'dcohen209@gmail.com')
    if (!user) {
      console.error('❌ User dcohen209@gmail.com not found')
      return
    }

    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`)

    // Check all plans for this user
    const { data: allPlans, error: allPlansError } = await supabase
      .from('plans')
      .select('id, user_id, status, created_at, total_cents')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (allPlansError) {
      console.error('❌ Error fetching plans:', allPlansError)
      return
    }

    console.log(`\n📊 All plans for user: ${allPlans.length}`)
    allPlans.forEach((plan, index) => {
      console.log(`   ${index + 1}. Plan ${plan.id}`)
      console.log(`      Status: ${plan.status}`)
      console.log(`      Total: $${(plan.total_cents / 100).toFixed(2)}`)
      console.log(`      Created: ${plan.created_at}`)
    })

    // Check active plans specifically
    const { data: activePlans, error: activePlansError } = await supabase
      .from('plans')
      .select('id, user_id, status, created_at, total_cents')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (activePlansError) {
      console.error('❌ Error fetching active plans:', activePlansError)
      return
    }

    console.log(`\n📊 Active plans: ${activePlans.length}`)
    activePlans.forEach((plan, index) => {
      console.log(`   ${index + 1}. Plan ${plan.id}`)
      console.log(`      Total: $${(plan.total_cents / 100).toFixed(2)}`)
      console.log(`      Created: ${plan.created_at}`)
    })

    // Check plan items for the most recent active plan
    if (activePlans.length > 0) {
      const mostRecentPlan = activePlans[0]
      console.log(`\n🔍 Checking plan items for most recent active plan: ${mostRecentPlan.id}`)

      const { data: planItems, error: planItemsError } = await supabase
        .from('plan_items')
        .select(`
          id,
          plan_id,
          dog_id,
          recipe_id,
          qty,
          unit_price_cents,
          amount_cents,
          billing_interval,
          stripe_price_id,
          recipes (name, slug),
          dogs (name)
        `)
        .eq('plan_id', mostRecentPlan.id)

      if (planItemsError) {
        console.error('❌ Error fetching plan items:', planItemsError)
      } else {
        console.log(`📊 Plan items: ${planItems.length}`)
        planItems.forEach((item, index) => {
          const recipeName = item.recipes?.name || 'Unknown'
          const dogName = item.dogs?.name || 'Unknown'
          console.log(`   ${index + 1}. ${dogName}'s ${recipeName}`)
          console.log(`      Price: $${(item.unit_price_cents / 100).toFixed(2)}`)
          console.log(`      Stripe Price ID: ${item.stripe_price_id}`)
        })
      }

      // Test the exact query used by checkout page
      console.log(`\n🧪 Testing checkout page query...`)
      const { data: checkoutPlans, error: checkoutError } = await supabase
        .from("plans")
        .select(`
          id,
          total_cents,
          plan_items (
            id,
            recipe_id,
            qty,
            unit_price_cents,
            amount_cents,
            billing_interval,
            stripe_price_id,
            recipes (name, slug),
            dogs (name)
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)

      if (checkoutError) {
        console.error('❌ Error with checkout query:', checkoutError)
      } else {
        console.log(`📊 Checkout query results: ${checkoutPlans.length} plans`)
        if (checkoutPlans.length > 0) {
          const plan = checkoutPlans[0]
          console.log(`   Plan ID: ${plan.id}`)
          console.log(`   Total: $${(plan.total_cents / 100).toFixed(2)}`)
          console.log(`   Plan items: ${plan.plan_items?.length || 0}`)
          
          if (plan.plan_items && plan.plan_items.length > 0) {
            plan.plan_items.forEach((item, index) => {
              const recipeName = item.recipes?.name || 'Unknown'
              const dogName = item.dogs?.name || 'Unknown'
              console.log(`     ${index + 1}. ${dogName}'s ${recipeName} - $${(item.unit_price_cents / 100).toFixed(2)}`)
            })
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error in debug script:', error)
  }
}

debugCheckoutData()
