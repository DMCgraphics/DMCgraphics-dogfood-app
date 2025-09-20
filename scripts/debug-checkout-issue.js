#!/usr/bin/env node

/**
 * Debug script to check checkout page data loading
 * This will help identify why the checkout page shows "No items found in your cart"
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugCheckoutIssue() {
  console.log('🔍 Debugging checkout page issue...\n')

  try {
    // Check all users and their recent activity
    console.log('1. Checking all users and their recent plans...')
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message)
      return
    }
    
    console.log('👥 Users found:')
    users.users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`)
      console.log(`      Last Sign In: ${user.last_sign_in_at}`)
    })
    
    // Check recent plans for each user
    console.log('\n2. Checking recent plans for each user...')
    for (const user of users.users) {
      console.log(`\n👤 Checking plans for ${user.email}...`)
      
      const { data: userPlans, error: plansError } = await supabase
        .from('plans')
        .select('id, status, total_cents, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3)
      
      if (plansError) {
        console.error(`   ❌ Error fetching plans for ${user.email}:`, plansError.message)
        continue
      }
      
      console.log(`   📋 Plans found: ${userPlans.length}`)
      userPlans.forEach((plan, index) => {
        console.log(`      ${index + 1}. Plan ${plan.id}`)
        console.log(`         Status: ${plan.status}`)
        console.log(`         Total: $${(plan.total_cents || 0) / 100}`)
        console.log(`         Created: ${plan.created_at}`)
      })
      
      // For each plan, check if it would show up in checkout
      for (const plan of userPlans) {
        console.log(`\n   🔍 Testing checkout query for plan ${plan.id}...`)
        
        const { data: checkoutData, error: checkoutError } = await supabase
          .from('plans')
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
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
        
        if (checkoutError) {
          console.error(`      ❌ Checkout query error:`, checkoutError.message)
        } else {
          console.log(`      📦 Checkout query results: ${checkoutData.length} plans`)
          if (checkoutData.length > 0) {
            const planData = checkoutData[0]
            console.log(`         Plan ID: ${planData.id}`)
            console.log(`         Total cents: ${planData.total_cents}`)
            console.log(`         Plan items: ${planData.plan_items?.length || 0}`)
            
            if (planData.plan_items && planData.plan_items.length > 0) {
              console.log(`         ✅ This plan WOULD show in checkout`)
              planData.plan_items.forEach((item, index) => {
                console.log(`            Item ${index + 1}: ${item.recipes?.name || 'Unknown'} for ${item.dogs?.name || 'Unknown Dog'}`)
              })
            } else {
              console.log(`         ❌ This plan would NOT show in checkout (no plan items)`)
            }
          } else {
            console.log(`         ❌ This plan would NOT show in checkout (no active plans)`)
          }
        }
      }
    }
    
    // Check for any plans with checkout_in_progress status
    console.log('\n3. Checking for plans with checkout_in_progress status...')
    const { data: checkoutPlans, error: checkoutPlansError } = await supabase
      .from('plans')
      .select('id, user_id, status, total_cents, created_at')
      .eq('status', 'checkout_in_progress')
      .order('created_at', { ascending: false })
    
    if (checkoutPlansError) {
      console.error('❌ Error fetching checkout_in_progress plans:', checkoutPlansError.message)
    } else {
      console.log(`📋 Plans with checkout_in_progress status: ${checkoutPlans.length}`)
      checkoutPlans.forEach((plan, index) => {
        console.log(`   ${index + 1}. Plan ${plan.id}`)
        console.log(`      User ID: ${plan.user_id}`)
        console.log(`      Total: $${(plan.total_cents || 0) / 100}`)
        console.log(`      Created: ${plan.created_at}`)
      })
    }
    
    console.log('\n4. Summary and recommendations:')
    console.log('   - If you see plans with "checkout_in_progress" status, those need to be updated to "active"')
    console.log('   - If you see plans with "active" status but no plan items, there\'s a data issue')
    console.log('   - If you see plans with plan items but they\'re not showing in checkout, there\'s a query issue')
    console.log('   - Make sure you\'re signed in as the correct user when testing checkout')

  } catch (error) {
    console.error('❌ Fatal error during debug:', error)
  }
}

// Run the debug
debugCheckoutIssue().catch(console.error)
