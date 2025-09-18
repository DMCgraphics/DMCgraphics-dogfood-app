#!/usr/bin/env node

// Script to clean up duplicate plan items
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanupDuplicatePlanItems() {
  console.log('🧹 Cleaning up duplicate plan items...\n')

  try {
    // Get the user ID for dcohen209@gmail.com
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

    // Get the plan with duplicate items
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select(`
        id,
        status,
        total_cents,
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
      .eq('status', 'checkout_in_progress')
      .order('created_at', { ascending: false })
      .limit(1)

    if (plansError) {
      console.error('❌ Error fetching plans:', plansError)
      return
    }

    if (!plans || plans.length === 0) {
      console.log('❌ No plans found')
      return
    }

    const plan = plans[0]
    console.log(`\n📋 Found plan: ${plan.id}`)
    console.log(`   Status: ${plan.status}`)
    console.log(`   Total: $${(plan.total_cents / 100).toFixed(2)}`)
    console.log(`   Plan Items: ${plan.plan_items?.length || 0}`)

    if (plan.plan_items && plan.plan_items.length > 1) {
      console.log('\n🔍 Found duplicate plan items:')
      plan.plan_items.forEach((item, index) => {
        const recipeName = item.recipes?.name || 'Unknown'
        console.log(`   ${index + 1}. ${recipeName} - Qty: ${item.qty}, Price: $${(item.unit_price_cents / 100).toFixed(2)} (ID: ${item.id})`)
      })

      // Keep the first item, delete the rest
      const itemsToDelete = plan.plan_items.slice(1)
      console.log(`\n🗑️  Will delete ${itemsToDelete.length} duplicate items:`)
      
      for (const item of itemsToDelete) {
        console.log(`   - Deleting item ${item.id} (${item.recipes?.name})`)
        const { error: deleteError } = await supabase
          .from('plan_items')
          .delete()
          .eq('id', item.id)

        if (deleteError) {
          console.error(`❌ Error deleting item ${item.id}:`, deleteError)
        } else {
          console.log(`✅ Deleted item ${item.id}`)
        }
      }

      // Update plan totals
      const remainingItem = plan.plan_items[0]
      const newTotal = remainingItem.amount_cents
      
      console.log(`\n🔄 Updating plan totals to $${(newTotal / 100).toFixed(2)}...`)
      const { error: updateError } = await supabase
        .from('plans')
        .update({
          subtotal_cents: newTotal,
          total_cents: newTotal
        })
        .eq('id', plan.id)

      if (updateError) {
        console.error('❌ Error updating plan totals:', updateError)
      } else {
        console.log('✅ Updated plan totals')
      }

      console.log('\n🎉 Duplicate cleanup completed!')
    } else {
      console.log('✅ No duplicate plan items found')
    }

  } catch (error) {
    console.error('❌ Error in cleanup script:', error)
  }
}

cleanupDuplicatePlanItems()
