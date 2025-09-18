const { createClient } = require('@supabase/supabase-js')
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tczvietgpixwonpqaotl.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixStoragePolicies() {
  console.log('🔧 Fixing storage policies...\n')

  try {
    // Check if buckets exist
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error fetching buckets:', bucketsError)
      return
    }

    console.log('Existing buckets:', buckets.map(b => b.name))

    // Create buckets if they don't exist
    const requiredBuckets = ['profile-photos', 'dog-photos']
    
    for (const bucketName of requiredBuckets) {
      const bucketExists = buckets.some(b => b.name === bucketName)
      
      if (!bucketExists) {
        console.log(`Creating bucket: ${bucketName}`)
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        })
        
        if (createError) {
          console.error(`❌ Error creating bucket ${bucketName}:`, createError)
        } else {
          console.log(`✅ Created bucket: ${bucketName}`)
        }
      } else {
        console.log(`✅ Bucket exists: ${bucketName}`)
      }
    }

    // Test upload to profile-photos bucket
    console.log('\n🧪 Testing upload to profile-photos bucket...')
    const testFileName = 'test-upload.txt'
    const testContent = 'This is a test file'
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(testFileName, testContent, {
        contentType: 'text/plain'
      })

    if (uploadError) {
      console.error('❌ Test upload failed:', uploadError)
    } else {
      console.log('✅ Test upload successful:', uploadData)
      
      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from('profile-photos')
        .remove([testFileName])
      
      if (deleteError) {
        console.log('⚠️ Could not delete test file:', deleteError)
      } else {
        console.log('✅ Test file cleaned up')
      }
    }

    console.log('\n🎉 Storage setup completed!')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixStoragePolicies()
