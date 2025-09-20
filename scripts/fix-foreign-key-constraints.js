#!/usr/bin/env node

/**
 * Fix foreign key constraints to enable proper cascade deletion
 * This script updates the database constraints so that deleting a user
 * automatically deletes all related data (dogs, plans, plan_items, subscriptions, orders)
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixForeignKeyConstraints() {
  console.log('🔧 Fixing foreign key constraints for cascade deletion...\n')

  try {
    // SQL commands to fix foreign key constraints
    const constraintFixes = [
      // Fix dogs table foreign key to auth.users
      {
        name: 'dogs_user_id_fkey',
        sql: `
          ALTER TABLE dogs DROP CONSTRAINT IF EXISTS dogs_user_id_fkey;
          ALTER TABLE dogs ADD CONSTRAINT dogs_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        `
      },
      
      // Fix plans table foreign key to auth.users
      {
        name: 'plans_user_id_fkey',
        sql: `
          ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_user_id_fkey;
          ALTER TABLE plans ADD CONSTRAINT plans_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        `
      },
      
      // Fix plans table foreign key to dogs
      {
        name: 'plans_dog_id_fkey',
        sql: `
          ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_dog_id_fkey;
          ALTER TABLE plans ADD CONSTRAINT plans_dog_id_fkey 
            FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE;
        `
      },
      
      // Fix plan_items table foreign key to plans
      {
        name: 'plan_items_plan_id_fkey',
        sql: `
          ALTER TABLE plan_items DROP CONSTRAINT IF EXISTS plan_items_plan_id_fkey;
          ALTER TABLE plan_items ADD CONSTRAINT plan_items_plan_id_fkey 
            FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;
        `
      },
      
      // Fix plan_items table foreign key to dogs
      {
        name: 'plan_items_dog_id_fkey',
        sql: `
          ALTER TABLE plan_items DROP CONSTRAINT IF EXISTS plan_items_dog_id_fkey;
          ALTER TABLE plan_items ADD CONSTRAINT plan_items_dog_id_fkey 
            FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE;
        `
      },
      
      // Fix subscriptions table foreign key to auth.users
      {
        name: 'subscriptions_user_id_fkey',
        sql: `
          ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
          ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        `
      },
      
      // Fix subscriptions table foreign key to plans
      {
        name: 'subscriptions_plan_id_fkey',
        sql: `
          ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_id_fkey;
          ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_id_fkey 
            FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;
        `
      },
      
      // Fix orders table foreign key to auth.users
      {
        name: 'orders_user_id_fkey',
        sql: `
          ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
          ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        `
      },
      
      // Fix orders table foreign key to plans
      {
        name: 'orders_plan_id_fkey',
        sql: `
          ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_plan_id_fkey;
          ALTER TABLE orders ADD CONSTRAINT orders_plan_id_fkey 
            FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;
        `
      },
      
      // Fix orders table foreign key to subscriptions
      {
        name: 'orders_subscription_id_fkey',
        sql: `
          ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_subscription_id_fkey;
          ALTER TABLE orders ADD CONSTRAINT orders_subscription_id_fkey 
            FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE;
        `
      }
    ]

    console.log('1. Applying foreign key constraint fixes...')
    
    let successCount = 0
    let errorCount = 0
    
    for (const fix of constraintFixes) {
      try {
        console.log(`   Fixing ${fix.name}...`)
        
        // Execute the SQL command
        const { error } = await supabase.rpc('exec_sql', { sql: fix.sql })
        
        if (error) {
          console.error(`   ❌ Error fixing ${fix.name}:`, error.message)
          errorCount++
        } else {
          console.log(`   ✅ Fixed ${fix.name}`)
          successCount++
        }
      } catch (err) {
        console.error(`   ❌ Exception fixing ${fix.name}:`, err.message)
        errorCount++
      }
    }

    console.log(`\n2. Constraint fix summary:`)
    console.log(`   ✅ Successfully fixed: ${successCount}`)
    console.log(`   ❌ Failed to fix: ${errorCount}`)
    
    if (errorCount === 0) {
      console.log('\n🎉 All foreign key constraints have been fixed!')
      console.log('   Now when you delete a user, all related data will be automatically deleted:')
      console.log('   - Dogs will be deleted')
      console.log('   - Plans will be deleted')
      console.log('   - Plan items will be deleted')
      console.log('   - Subscriptions will be deleted')
      console.log('   - Orders will be deleted')
    } else {
      console.log('\n⚠️  Some constraints could not be fixed.')
      console.log('   You may need to run the SQL script manually in your database admin panel.')
    }

    // Test the constraints by checking if they exist
    console.log('\n3. Verifying constraints...')
    
    // This is a simple test - we'll try to get constraint information
    // Note: This might not work depending on the database setup
    try {
      const { data: constraints, error: constraintError } = await supabase
        .from('information_schema.table_constraints')
        .select('constraint_name, table_name, constraint_type')
        .eq('constraint_type', 'FOREIGN KEY')
        .in('table_name', ['dogs', 'plans', 'plan_items', 'subscriptions', 'orders'])
        .limit(20)
      
      if (constraintError) {
        console.log('   ⚠️  Could not verify constraints (this is normal for some database setups)')
      } else {
        console.log(`   Found ${constraints?.length || 0} foreign key constraints`)
        constraints?.forEach(constraint => {
          console.log(`     - ${constraint.table_name}.${constraint.constraint_name}`)
        })
      }
    } catch (err) {
      console.log('   ⚠️  Could not verify constraints (this is normal for some database setups)')
    }

  } catch (error) {
    console.error('❌ Fatal error during constraint fixing:', error)
  }
}

// Run the constraint fixing
fixForeignKeyConstraints().catch(console.error)
