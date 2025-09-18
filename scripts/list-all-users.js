#!/usr/bin/env node

// Script to list all users
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function listAllUsers() {
  console.log('🔍 Listing all users...\n')

  try {
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return
    }

    console.log(`✅ Found ${authUsers.users.length} users:`)
    authUsers.users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (ID: ${user.id}) - Created: ${user.created_at}`)
    })

    // Check for users with dcohen in the email
    const dcohenUsers = authUsers.users.filter(u => u.email.includes('dcohen'))
    if (dcohenUsers.length > 0) {
      console.log(`\n🔍 Found ${dcohenUsers.length} dcohen users:`)
      dcohenUsers.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id})`)
      })
    }

  } catch (error) {
    console.error('❌ Error listing users:', error)
  }
}

listAllUsers()
