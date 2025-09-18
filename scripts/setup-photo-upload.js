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

async function setupPhotoUpload() {
  console.log('🔧 Setting up photo upload functionality...\n')

  try {
    // 1. Check if storage buckets exist
    console.log('1. Checking storage buckets...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error fetching buckets:', bucketsError)
      return
    }

    const bucketNames = buckets.map(bucket => bucket.name)
    console.log('Existing buckets:', bucketNames)

    // 2. Create profile-photos bucket if it doesn't exist
    if (!bucketNames.includes('profile-photos')) {
      console.log('Creating profile-photos bucket...')
      const { error: profileBucketError } = await supabase.storage.createBucket('profile-photos', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      })
      
      if (profileBucketError) {
        console.error('❌ Error creating profile-photos bucket:', profileBucketError)
      } else {
        console.log('✅ profile-photos bucket created successfully')
      }
    } else {
      console.log('✅ profile-photos bucket already exists')
    }

    // 3. Create dog-photos bucket if it doesn't exist
    if (!bucketNames.includes('dog-photos')) {
      console.log('Creating dog-photos bucket...')
      const { error: dogBucketError } = await supabase.storage.createBucket('dog-photos', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      })
      
      if (dogBucketError) {
        console.error('❌ Error creating dog-photos bucket:', dogBucketError)
      } else {
        console.log('✅ dog-photos bucket created successfully')
      }
    } else {
      console.log('✅ dog-photos bucket already exists')
    }

    // 4. Check if avatar_url column exists in dogs table
    console.log('\n2. Checking dogs table schema...')
    const { data: dogsData, error: dogsError } = await supabase
      .from('dogs')
      .select('*')
      .limit(1)

    if (dogsError) {
      console.error('❌ Error checking dogs table:', dogsError)
      return
    }

    if (dogsData && dogsData.length > 0) {
      const columns = Object.keys(dogsData[0])
      if (columns.includes('avatar_url')) {
        console.log('✅ avatar_url column exists in dogs table')
      } else {
        console.log('❌ avatar_url column missing from dogs table')
        console.log('\n📋 MANUAL STEP REQUIRED:')
        console.log('Please run this SQL command in your Supabase SQL editor:')
        console.log('ALTER TABLE dogs ADD COLUMN avatar_url TEXT;')
        console.log('\nOr copy and paste this into your Supabase dashboard:')
        console.log('```sql')
        console.log('ALTER TABLE dogs ADD COLUMN avatar_url TEXT;')
        console.log('```')
      }
    }

    // 5. Check if avatar_url column exists in profiles table
    console.log('\n3. Checking profiles table schema...')
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (profilesError) {
      console.error('❌ Error checking profiles table:', profilesError)
      return
    }

    if (profilesData && profilesData.length > 0) {
      const columns = Object.keys(profilesData[0])
      if (columns.includes('avatar_url')) {
        console.log('✅ avatar_url column exists in profiles table')
      } else {
        console.log('❌ avatar_url column missing from profiles table')
        console.log('\n📋 MANUAL STEP REQUIRED:')
        console.log('Please run this SQL command in your Supabase SQL editor:')
        console.log('ALTER TABLE profiles ADD COLUMN avatar_url TEXT;')
        console.log('\nOr copy and paste this into your Supabase dashboard:')
        console.log('```sql')
        console.log('ALTER TABLE profiles ADD COLUMN avatar_url TEXT;')
        console.log('```')
      }
    }

    console.log('\n🎉 Photo upload setup completed!')
    console.log('\n📝 Next steps:')
    console.log('1. Add the missing database columns (if any) using the SQL commands above')
    console.log('2. Test the photo upload functionality in your app')
    console.log('3. The photo upload should now work for both user profiles and dog profiles')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

setupPhotoUpload()
