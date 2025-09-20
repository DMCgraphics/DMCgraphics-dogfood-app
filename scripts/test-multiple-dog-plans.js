#!/usr/bin/env node

/**
 * Test script to understand how multiple dogs should be handled
 * This will help us understand the correct approach for multiple dog plans
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testMultipleDogPlans() {
  console.log('🐕 Testing Multiple Dog Plans Approach...\n')

  try {
    // Get user ID for dcohen@nouripet.net
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()
    const user = users.users.find(u => u.email === 'dcohen@nouripet.net')
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log('👤 User ID:', user.id)
    
    // Check current state
    const { data: dogs, error: dogsError } = await supabase
      .from('dogs')
      .select('*')
      .eq('user_id', user.id)
      
    console.log('🐕 Current dogs:', dogs?.length || 0)
    dogs?.forEach(dog => console.log('  -', dog.name, dog.id))
    
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', user.id)
      
    console.log('📋 Current plans:', plans?.length || 0)
    plans?.forEach(plan => console.log('  - Plan ID:', plan.id, 'Dog ID:', plan.dog_id, 'Status:', plan.status))
    
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      
    console.log('💳 Current subscriptions:', subscriptions?.length || 0)
    subscriptions?.forEach(sub => console.log('  - Sub ID:', sub.id, 'Plan ID:', sub.plan_id, 'Status:', sub.status))
    
    // Analyze the relationship
    console.log('\n🔍 Analysis:')
    console.log('   Current approach: 1 dog, 1 plan, 1 subscription')
    console.log('   This is correct for single dog scenarios')
    
    console.log('\n📝 For multiple dogs, the correct approach should be:')
    console.log('   - 1 plan per dog (each plan linked to a specific dog)')
    console.log('   - 1 subscription per plan (or 1 subscription for all plans)')
    console.log('   - Each plan can have different recipes, portions, etc.')
    
    console.log('\n🤔 Questions to consider:')
    console.log('   1. Should there be 1 subscription for all plans or 1 subscription per plan?')
    console.log('   2. How should billing work - combined or separate?')
    console.log('   3. How should the dashboard display multiple plans?')
    
    // Check if there are any plan_items
    const { data: planItems, error: planItemsError } = await supabase
      .from('plan_items')
      .select('*')
      .eq('plan_id', plans?.[0]?.id || '')
      
    console.log('\n📦 Plan items for first plan:', planItems?.length || 0)
    planItems?.forEach(item => console.log('  - Item ID:', item.id, 'Dog ID:', item.dog_id, 'Recipe ID:', item.recipe_id))
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testMultipleDogPlans().catch(console.error)
