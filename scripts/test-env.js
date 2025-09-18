const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local if it exists
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  const envLines = envContent.split('\n')
  
  envLines.forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim()
      if (value && !process.env[key]) {
        process.env[key] = value
      }
    }
  })
}

console.log('Environment variables check:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET')

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('Service role key (first 10 chars):', process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...')
}
