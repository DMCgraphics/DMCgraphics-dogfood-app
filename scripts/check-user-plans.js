#!/usr/bin/env node

// Script to check user plans and plan items
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUserPlans() {
  console.log('🔍 Checking user plans and plan items...\n')

  try {
    // Get the user ID for dcohen@nouripet.net
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return
    }

    const user = authUsers.users.find(u => u.email === 'dcohen209@gmail.com')
    if (!user) {
      console.error('❌ User dcohen209@gmail.com not found')
      return
    }

    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`)

    // Get all plans for this user
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select(`
        id,
        status,
        total_cents,
        created_at,
        updated_at,
        dogs (name),
        plan_items (
          id,
          recipe_id,
          qty,
          unit_price_cents,
          amount_cents,
          stripe_price_id,
          recipes (name, slug)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (plansError) {
      console.error('❌ Error fetching plans:', plansError)
      return
    }

    console.log(`\n📋 Found ${plans.length} plans for user:`)
    plans.forEach((plan, index) => {
      console.log(`\n${index + 1}. Plan ${plan.id}`)
      console.log(`   Status: ${plan.status}`)
      console.log(`   Total: $${(plan.total_cents / 100).toFixed(2)}`)
      console.log(`   Created: ${plan.created_at}`)
      console.log(`   Updated: ${plan.updated_at}`)
      console.log(`   Dog: ${plan.dogs?.name || 'Unknown'}`)
      console.log(`   Plan Items: ${plan.plan_items?.length || 0}`)
      
      if (plan.plan_items && plan.plan_items.length > 0) {
        plan.plan_items.forEach((item, itemIndex) => {
          const recipeName = item.recipes?.name || 'Unknown'
          console.log(`     ${itemIndex + 1}. ${recipeName} - Qty: ${item.qty}, Price: $${(item.unit_price_cents / 100).toFixed(2)}`)
        })
      }
    })

    // Check for duplicate plan items
    console.log('\n🔍 Checking for duplicate plan items...')
    const allPlanItems = plans.flatMap(plan => plan.plan_items || [])
    const recipeCounts = {}
    
    allPlanItems.forEach(item => {
      const recipeName = item.recipes?.name || 'Unknown'
      recipeCounts[recipeName] = (recipeCounts[recipeName] || 0) + item.qty
    })

    console.log('Recipe quantities across all plans:')
    Object.entries(recipeCounts).forEach(([recipe, count]) => {
      console.log(`   ${recipe}: ${count}`)
    })

    // Check the current_user_plan view
    console.log('\n🔍 Checking current_user_plan view...')
    const { data: currentPlan, error: currentPlanError } = await supabase
      .from('current_user_plan')
      .select('*')
      .single()

    if (currentPlanError) {
      console.error('❌ Error with current_user_plan view:', currentPlanError)
    } else {
      console.log('✅ current_user_plan view result:')
      console.log(JSON.stringify(currentPlan, null, 2))
    }

  } catch (error) {
    console.error('❌ Error in user plans check:', error)
  }
}

checkUserPlans()
