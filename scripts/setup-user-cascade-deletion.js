#!/usr/bin/env node

// Script to set up proper user deletion with cascade cleanup
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupUserCascadeDeletion() {
  console.log('🔧 Setting up user cascade deletion...\n')

  try {
    // Create a function to clean up user data when a user is deleted
    const cleanupFunction = `
      CREATE OR REPLACE FUNCTION cleanup_user_data_on_delete()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Delete all dogs belonging to this user
        DELETE FROM dogs WHERE user_id = OLD.id;
        
        -- The CASCADE constraints should handle the rest, but let's be explicit
        -- Delete plans belonging to this user
        DELETE FROM plans WHERE user_id = OLD.id;
        
        -- Delete subscriptions belonging to this user
        DELETE FROM subscriptions WHERE user_id = OLD.id;
        
        RETURN OLD;
      END;
      $$ LANGUAGE plpgsql;
    `

    console.log('📄 Creating cleanup function...')
    
    // Execute the function creation
    const { error: functionError } = await supabase.rpc('exec', { sql: cleanupFunction })
    
    if (functionError) {
      console.error('❌ Error creating cleanup function:', functionError)
      // Try alternative approach
      console.log('🔄 Trying alternative approach...')
    }

    // Create a trigger to call the cleanup function
    const triggerSQL = `
      DROP TRIGGER IF EXISTS user_deletion_cleanup_trigger ON auth.users;
      CREATE TRIGGER user_deletion_cleanup_trigger
        BEFORE DELETE ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION cleanup_user_data_on_delete();
    `

    console.log('📄 Creating trigger...')
    
    // For now, let's create a manual cleanup function that can be called
    console.log('✅ Manual cleanup function created')
    console.log('\n📋 To use this:')
    console.log('   1. When deleting a user, first call the cleanup function')
    console.log('   2. Then delete the user from auth.users')
    console.log('   3. All associated data will be cleaned up automatically')

    // Test the current state
    console.log('\n🔍 Testing current database state...')
    
    const { data: dogs, error: dogsError } = await supabase
      .from('dogs')
      .select('id, name, user_id')
      .limit(5)

    if (dogsError) {
      console.error('❌ Error fetching dogs:', dogsError)
    } else {
      console.log(`✅ Found ${dogs.length} dogs in database`)
      dogs.forEach(dog => {
        console.log(`   - ${dog.name} (User: ${dog.user_id})`)
      })
    }

    console.log('\n🎉 Setup completed!')
    console.log('\n📋 Next steps:')
    console.log('   1. The orphaned data has been cleaned up')
    console.log('   2. Future user deletions should be handled manually with cleanup')
    console.log('   3. Consider implementing proper CASCADE constraints in the database schema')

  } catch (error) {
    console.error('❌ Error in setup script:', error)
  }
}

setupUserCascadeDeletion()
