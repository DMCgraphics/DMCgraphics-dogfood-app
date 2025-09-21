#!/usr/bin/env node

/**
 * Data integrity validation script
 * Checks for incomplete or invalid data that could prevent user deletion
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function validateDataIntegrity() {
  console.log('🔍 Validating data integrity across all tables...\n')

  try {
    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message)
      return
    }
    
    console.log(`Found ${users.users.length} users to validate\n`)
    
    let totalIssues = 0
    let usersWithIssues = 0
    
    for (const user of users.users) {
      console.log(`📊 Validating user: ${user.email}`)
      
      const issues = await validateUserData(user.id, user.email)
      
      if (issues.length > 0) {
        usersWithIssues++
        totalIssues += issues.length
        console.log(`   🚨 Found ${issues.length} issues:`)
        issues.forEach(issue => console.log(`      - ${issue}`))
      } else {
        console.log(`   ✅ No issues found`)
      }
      
      console.log('') // Empty line for readability
    }
    
    // Summary
    console.log('📋 Validation Summary:')
    console.log(`   Total users: ${users.users.length}`)
    console.log(`   Users with issues: ${usersWithIssues}`)
    console.log(`   Total issues found: ${totalIssues}`)
    
    if (totalIssues === 0) {
      console.log('\n🎉 All data is valid! No integrity issues found.')
    } else {
      console.log('\n⚠️  Data integrity issues found. Consider running cleanup scripts.')
    }
    
  } catch (error) {
    console.error('❌ Fatal error during validation:', error)
  }
}

async function validateUserData(userId, userEmail) {
  const issues = []
  
  try {
    // Check dogs
    const { data: dogs, error: dogsError } = await supabase
      .from('dogs')
      .select('*')
      .eq('user_id', userId)
    
    if (dogsError) {
      issues.push(`Dogs table error: ${dogsError.message}`)
    } else if (dogs && dogs.length > 0) {
      dogs.forEach((dog, index) => {
        if (!dog.name || dog.name.trim().length === 0) {
          issues.push(`Dog ${index + 1}: Empty or missing name`)
        }
        if (!dog.weight || dog.weight <= 0) {
          issues.push(`Dog ${index + 1}: Invalid weight (${dog.weight})`)
        }
        if (!dog.weight_unit || !['lb', 'kg'].includes(dog.weight_unit)) {
          issues.push(`Dog ${index + 1}: Invalid weight_unit (${dog.weight_unit})`)
        }
        if (!dog.weight_kg || dog.weight_kg <= 0) {
          issues.push(`Dog ${index + 1}: Missing or invalid weight_kg (${dog.weight_kg})`)
        }
        if (dog.age !== null && (dog.age < 0 || dog.age > 30)) {
          issues.push(`Dog ${index + 1}: Invalid age (${dog.age})`)
        }
      })
    }
    
    // Check plans
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', userId)
    
    if (plansError) {
      issues.push(`Plans table error: ${plansError.message}`)
    } else if (plans && plans.length > 0) {
      plans.forEach((plan, index) => {
        if (!plan.status || !['draft', 'saved', 'checkout', 'active', 'paused', 'cancelled'].includes(plan.status)) {
          issues.push(`Plan ${index + 1}: Invalid status (${plan.status})`)
        }
        if (plan.subtotal_cents === null || plan.subtotal_cents === undefined || plan.subtotal_cents < 0) {
          issues.push(`Plan ${index + 1}: Invalid subtotal_cents (${plan.subtotal_cents})`)
        }
        if (plan.total_cents === null || plan.total_cents === undefined || plan.total_cents < 0) {
          issues.push(`Plan ${index + 1}: Invalid total_cents (${plan.total_cents})`)
        }
        if (plan.discount_cents !== null && plan.discount_cents !== undefined && plan.discount_cents < 0) {
          issues.push(`Plan ${index + 1}: Invalid discount_cents (${plan.discount_cents})`)
        }
        if (plan.current_step !== null && plan.current_step !== undefined && (plan.current_step < 0 || plan.current_step > 10)) {
          issues.push(`Plan ${index + 1}: Invalid current_step (${plan.current_step})`)
        }
        // Check for incomplete checkout data
        if (plan.status === 'checkout' || plan.status === 'active') {
          if (!plan.stripe_session_id && !plan.stripe_subscription_id) {
            issues.push(`Plan ${index + 1}: Missing Stripe data for ${plan.status} status`)
          }
        }
      })
    }
    
    // Check plan_items
    if (plans && plans.length > 0) {
      const planIds = plans.map(p => p.id)
      const { data: planItems, error: planItemsError } = await supabase
        .from('plan_items')
        .select('*')
        .in('plan_id', planIds)
      
      if (planItemsError) {
        issues.push(`Plan items table error: ${planItemsError.message}`)
      } else if (planItems && planItems.length > 0) {
        planItems.forEach((item, index) => {
          if (item.qty !== null && item.qty !== undefined && item.qty <= 0) {
            issues.push(`Plan item ${index + 1}: Invalid qty (${item.qty})`)
          }
          if (item.size_g !== null && item.size_g !== undefined && item.size_g <= 0) {
            issues.push(`Plan item ${index + 1}: Invalid size_g (${item.size_g})`)
          }
          // Note: unit_amount_cents column doesn't exist in current schema
        })
      }
    }
    
    // Check subscriptions
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
    
    if (subscriptionsError) {
      issues.push(`Subscriptions table error: ${subscriptionsError.message}`)
    } else if (subscriptions && subscriptions.length > 0) {
      subscriptions.forEach((sub, index) => {
        if (!sub.status || !['active', 'paused', 'cancelled', 'expired'].includes(sub.status)) {
          issues.push(`Subscription ${index + 1}: Invalid status (${sub.status})`)
        }
        if (sub.billing_cycle && !['weekly', 'monthly', 'quarterly'].includes(sub.billing_cycle)) {
          issues.push(`Subscription ${index + 1}: Invalid billing_cycle (${sub.billing_cycle})`)
        }
        if (sub.price_monthly !== null && sub.price_monthly !== undefined && sub.price_monthly < 0) {
          issues.push(`Subscription ${index + 1}: Invalid price_monthly (${sub.price_monthly})`)
        }
      })
    }
    
    // Check orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
    
    if (ordersError) {
      issues.push(`Orders table error: ${ordersError.message}`)
    } else if (orders && orders.length > 0) {
      orders.forEach((order, index) => {
        if (!order.status || order.status.trim().length === 0) {
          issues.push(`Order ${index + 1}: Empty or missing status`)
        }
        if (order.total_cents !== null && order.total_cents !== undefined && order.total_cents < 0) {
          issues.push(`Order ${index + 1}: Invalid total_cents (${order.total_cents})`)
        }
      })
    }
    
    // Check for orphaned data
    if (dogs && dogs.length > 0) {
      const dogIds = dogs.map(d => d.id)
      
      // Check dog_metrics
      const { data: dogMetrics, error: dogMetricsError } = await supabase
        .from('dog_metrics')
        .select('*')
        .in('dog_id', dogIds)
      
      if (dogMetricsError && dogMetricsError.code !== 'PGRST116') {
        issues.push(`Dog metrics table error: ${dogMetricsError.message}`)
      }
      
      // Check plan_dogs
      const { data: planDogs, error: planDogsError } = await supabase
        .from('plan_dogs')
        .select('*')
        .in('dog_id', dogIds)
      
      if (planDogsError && planDogsError.code !== 'PGRST116') {
        issues.push(`Plan dogs table error: ${planDogsError.message}`)
      }
    }
    
  } catch (error) {
    issues.push(`Validation error: ${error.message}`)
  }
  
  return issues
}

async function fixCommonIssues() {
  console.log('🔧 Attempting to fix common data integrity issues...\n')
  
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message)
      return
    }
    
    let fixedIssues = 0
    
    for (const user of users.users) {
      console.log(`🔧 Fixing issues for user: ${user.email}`)
      
      // Fix dog weight_kg calculations
      const { data: dogs, error: dogsError } = await supabase
        .from('dogs')
        .select('*')
        .eq('user_id', user.id)
      
      if (!dogsError && dogs && dogs.length > 0) {
        for (const dog of dogs) {
          if (!dog.weight_kg && dog.weight && dog.weight_unit) {
            const weight_kg = dog.weight_unit === 'lb' ? dog.weight * 0.453592 : dog.weight
            
            const { error: updateError } = await supabase
              .from('dogs')
              .update({ weight_kg })
              .eq('id', dog.id)
            
            if (!updateError) {
              console.log(`   ✅ Fixed weight_kg for dog: ${dog.name}`)
              fixedIssues++
            }
          }
        }
      }
      
      // Fix plan total_cents calculations
      const { data: plans, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .eq('user_id', user.id)
      
      if (!plansError && plans && plans.length > 0) {
        for (const plan of plans) {
          if (plan.subtotal_cents !== null && plan.subtotal_cents !== undefined) {
            const calculatedTotal = plan.subtotal_cents - (plan.discount_cents || 0)
            
            if (plan.total_cents !== calculatedTotal) {
              const { error: updateError } = await supabase
                .from('plans')
                .update({ total_cents: calculatedTotal })
                .eq('id', plan.id)
              
              if (!updateError) {
                console.log(`   ✅ Fixed total_cents for plan: ${plan.id}`)
                fixedIssues++
              }
            }
          }
        }
      }
    }
    
    console.log(`\n✅ Fixed ${fixedIssues} data integrity issues`)
    
  } catch (error) {
    console.error('❌ Error fixing issues:', error)
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--fix')) {
    await fixCommonIssues()
  } else {
    await validateDataIntegrity()
    
    if (args.includes('--help')) {
      console.log('\nUsage:')
      console.log('  node validate-data-integrity.js        # Validate data integrity')
      console.log('  node validate-data-integrity.js --fix  # Fix common issues')
      console.log('  node validate-data-integrity.js --help # Show this help')
    }
  }
}

main().catch(console.error)
