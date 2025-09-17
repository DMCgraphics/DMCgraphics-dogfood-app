#!/usr/bin/env node

/**
 * Check what tables exist and their structure
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTables() {
  console.log('🔍 Checking Available Tables...\n')

  try {
    // Try to get data from various tables to see which ones exist
    const tables = [
      'dog_notes',
      'stool_entries', 
      'health_logs',
      'dog_health_logs',
      'notes',
      'logs'
    ]

    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)

        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`)
        } else {
          console.log(`✅ ${tableName}: Found ${data.length} records`)
          if (data.length > 0) {
            console.log(`   Schema: ${Object.keys(data[0]).join(', ')}`)
          }
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`)
      }
    }

    // Check if there are any tables that might contain stool/health data
    console.log('\n📋 Checking for any health-related data:')
    
    // Try to find tables with health data
    const healthTables = ['dogs', 'plans', 'subscriptions', 'orders']
    
    for (const tableName of healthTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)

        if (!error && data.length > 0) {
          console.log(`✅ ${tableName}: Available`)
          const sample = data[0]
          const healthRelatedFields = Object.keys(sample).filter(key => 
            key.includes('health') || 
            key.includes('stool') || 
            key.includes('weight') || 
            key.includes('note') ||
            key.includes('log')
          )
          if (healthRelatedFields.length > 0) {
            console.log(`   Health-related fields: ${healthRelatedFields.join(', ')}`)
          }
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`)
      }
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

checkTables()
