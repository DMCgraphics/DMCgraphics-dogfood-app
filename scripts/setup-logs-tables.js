const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'NOT SET')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupLogsTables() {
  try {
    console.log('Setting up weight_logs and stool_logs tables...')
    
    // Read the SQL file
    const fs = require('fs')
    const sql = fs.readFileSync('./scripts/create-logs-tables.sql', 'utf8')
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec', { sql })
    
    if (error) {
      console.error('Error executing SQL:', error)
      return
    }
    
    console.log('✅ Successfully created weight_logs and stool_logs tables')
    console.log('✅ RLS policies and indexes created')
    
  } catch (error) {
    console.error('Error setting up tables:', error)
  }
}

setupLogsTables()
