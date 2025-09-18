const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTables() {
  try {
    console.log('Checking if weight_logs and stool_logs tables exist...')
    
    // Check weight_logs
    const { data: weightData, error: weightError } = await supabase
      .from('weight_logs')
      .select('*')
      .limit(1)
    
    console.log('weight_logs table:', weightError ? 'NOT EXISTS' : 'EXISTS')
    if (weightError) console.log('Error:', weightError.message)
    
    // Check stool_logs
    const { data: stoolData, error: stoolError } = await supabase
      .from('stool_logs')
      .select('*')
      .limit(1)
    
    console.log('stool_logs table:', stoolError ? 'NOT EXISTS' : 'EXISTS')
    if (stoolError) console.log('Error:', stoolError.message)
    
  } catch (error) {
    console.error('Error checking tables:', error)
  }
}

checkTables()