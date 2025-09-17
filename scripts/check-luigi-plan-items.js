#!/usr/bin/env node

/**
 * Check what items are in Luigi's plan
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkLuigiPlanItems() {
  console.log('🔍 Checking Luigi\'s Plan Items...\n')

  try {
    // Get Luigi's plan with all items
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select(`
        *,
        plan_items (
          *,
          recipes (
            name,
            category
          )
        )
      `)
      .eq('dog_id', 'c9fe0058-f45f-44b0-bbc5-01b18688684c') // Luigi's ID
      .eq('status', 'active')
      .single()

    if (planError) {
      console.error('❌ Error fetching plan:', planError)
      return
    }

    console.log('📋 Luigi\'s Plan:')
    console.log(`   Plan ID: ${plan.id}`)
    console.log(`   Dog ID: ${plan.dog_id}`)
    console.log(`   Status: ${plan.status}`)
    console.log(`   Total Items: ${plan.plan_items?.length || 0}`)

    console.log('\n📋 Plan Items:')
    if (plan.plan_items && plan.plan_items.length > 0) {
      plan.plan_items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.recipes?.name || 'Unknown Recipe'}`)
        console.log(`      Category: ${item.recipes?.category || 'Unknown'}`)
        console.log(`      Qty: ${item.qty || 1} weeks`)
        console.log(`      Amount: $${(item.amount_cents || 0) / 100}`)
        console.log(`      Billing: ${item.billing_interval || 'Unknown'}`)
        console.log(`      Meta: ${JSON.stringify(item.meta, null, 2)}`)
      })
    } else {
      console.log('   ❌ No plan items found')
    }

    // Check if plan includes medical or prescription items
    const hasMedicalItems = plan.plan_items?.some(item => 
      item.recipes?.category === 'medical' || 
      item.recipes?.category === 'prescription' ||
      item.recipes?.name?.toLowerCase().includes('medical') ||
      item.recipes?.name?.toLowerCase().includes('prescription') ||
      item.recipes?.name?.toLowerCase().includes('renal') ||
      item.recipes?.name?.toLowerCase().includes('kidney')
    ) || false

    console.log('\n🔍 Plan Analysis:')
    console.log(`   Has Medical/Prescription Items: ${hasMedicalItems}`)
    
    if (hasMedicalItems) {
      console.log('   ✅ Medical Conditions and Prescription Status widgets should be shown')
    } else {
      console.log('   ❌ Medical Conditions and Prescription Status widgets should be hidden')
    }

    // Check for stool quality data
    console.log('\n📋 Checking Stool Quality Data:')
    const { data: stoolEntries, error: stoolError } = await supabase
      .from('dog_notes')
      .select('*')
      .eq('user_id', plan.user_id)
      .eq('type', 'stool')
      .order('created_at', { ascending: false })

    if (stoolError) {
      console.error('❌ Error fetching stool entries:', stoolError)
    } else {
      console.log(`   Found ${stoolEntries.length} stool entries`)
      if (stoolEntries.length > 0) {
        console.log('   Recent entries:')
        stoolEntries.slice(0, 3).forEach((entry, index) => {
          const date = new Date(entry.created_at).toLocaleDateString()
          console.log(`      ${index + 1}. Score ${entry.score} - ${date}`)
        })
      } else {
        console.log('   ❌ No stool entries found - dashboard will use mock data')
      }
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

checkLuigiPlanItems()
