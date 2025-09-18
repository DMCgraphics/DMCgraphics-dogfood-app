#!/usr/bin/env node

// Script to set up cascade deletion for user-related data
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupCascadeDeletion() {
  console.log('🔧 Setting up cascade deletion for user-related data...\n')

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'setup-cascade-deletion.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    console.log('📄 SQL script loaded, executing...')

    // Execute the SQL script
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent })

    if (error) {
      console.error('❌ Error executing SQL script:', error)
      return
    }

    console.log('✅ SQL script executed successfully')

    // Verify the constraints are set up correctly
    console.log('\n🔍 Verifying foreign key constraints...')
    
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select(`
        table_name,
        constraint_name,
        constraint_type
      `)
      .eq('constraint_type', 'FOREIGN KEY')
      .in('table_name', ['dogs', 'plans', 'plan_items', 'plan_dogs', 'dog_metrics', 'subscriptions'])

    if (constraintsError) {
      console.error('❌ Error fetching constraints:', constraintsError)
    } else {
      console.log(`✅ Found ${constraints.length} foreign key constraints:`)
      constraints.forEach(constraint => {
        console.log(`   - ${constraint.table_name}.${constraint.constraint_name}`)
      })
    }

    console.log('\n🎉 Cascade deletion setup completed!')
    console.log('\n📋 What this means:')
    console.log('   ✅ When a user is deleted, all their dogs will be automatically deleted')
    console.log('   ✅ When a dog is deleted, all their plans and plan items will be automatically deleted')
    console.log('   ✅ When a plan is deleted, all its plan items will be automatically deleted')
    console.log('   ✅ No more orphaned data in the database')

  } catch (error) {
    console.error('❌ Error in setup script:', error)
  }
}

setupCascadeDeletion()
