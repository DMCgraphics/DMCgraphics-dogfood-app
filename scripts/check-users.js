#!/usr/bin/env node

/**
 * Check what users exist in the database
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUsers() {
  console.log('👥 Checking Users in Database...\n')

  try {
    // Get all users from profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError)
      return
    }

    console.log(`Found ${profiles.length} users in profiles table:`)
    profiles.forEach((profile, index) => {
      console.log(`   ${index + 1}. ${profile.id} - ${profile.email} (${profile.created_at})`)
    })

    // Get user IDs from webhook events
    const { data: webhookEvents, error: eventsError } = await supabase
      .from('stripe_events')
      .select('payload')
      .eq('type', 'checkout.session.completed')
      .order('created_at', { ascending: false })
      .limit(10)

    if (eventsError) {
      console.error('❌ Error fetching webhook events:', eventsError)
      return
    }

    const webhookUserIds = new Set()
    webhookEvents.forEach(event => {
      const userId = event.payload?.data?.object?.metadata?.user_id
      if (userId) {
        webhookUserIds.add(userId)
      }
    })

    console.log(`\nFound ${webhookUserIds.size} unique user IDs in webhook events:`)
    webhookUserIds.forEach(userId => {
      console.log(`   - ${userId}`)
    })

    // Check which webhook user IDs exist in profiles
    const existingUserIds = new Set(profiles.map(p => p.id))
    const missingUserIds = new Set()
    const existingWebhookUserIds = new Set()

    webhookUserIds.forEach(userId => {
      if (existingUserIds.has(userId)) {
        existingWebhookUserIds.add(userId)
      } else {
        missingUserIds.add(userId)
      }
    })

    console.log(`\n📊 Analysis:`)
    console.log(`   ✅ Webhook user IDs that exist in profiles: ${existingWebhookUserIds.size}`)
    console.log(`   ❌ Webhook user IDs missing from profiles: ${missingUserIds.size}`)

    if (missingUserIds.size > 0) {
      console.log(`\n🚨 Missing User IDs:`)
      missingUserIds.forEach(userId => {
        console.log(`   - ${userId}`)
      })
      console.log(`\n💡 This explains why subscriptions can't be created!`)
      console.log(`   The webhook events reference users that don't exist in your database.`)
    }

    if (existingWebhookUserIds.size > 0) {
      console.log(`\n✅ Existing User IDs that can have subscriptions:`)
      existingWebhookUserIds.forEach(userId => {
        console.log(`   - ${userId}`)
      })
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

checkUsers()
