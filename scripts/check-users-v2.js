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

async function checkUsersV2() {
  console.log('👥 Checking Users in Database (Version 2)...\n')

  try {
    // Get all users from profiles table (without email field)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError)
      return
    }

    console.log(`Found ${profiles.length} users in profiles table:`)
    profiles.forEach((profile, index) => {
      console.log(`   ${index + 1}. ${profile.id} - ${profile.created_at}`)
      if (profile.first_name) console.log(`      Name: ${profile.first_name} ${profile.last_name || ''}`)
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

    // Check current active plans and their users
    console.log(`\n🔍 Checking Current Active Plans:`)
    const { data: activePlans, error: plansError } = await supabase
      .from('plans')
      .select('id, user_id, status, updated_at')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })

    if (plansError) {
      console.error('❌ Error fetching plans:', plansError)
    } else {
      console.log(`   Found ${activePlans.length} active plans:`)
      activePlans.forEach((plan, index) => {
        const userExists = existingUserIds.has(plan.user_id)
        console.log(`   ${index + 1}. Plan: ${plan.id}`)
        console.log(`      User ID: ${plan.user_id} ${userExists ? '✅' : '❌'}`)
        console.log(`      Status: ${plan.status}`)
        console.log(`      Updated: ${plan.updated_at}`)
      })
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

checkUsersV2()
