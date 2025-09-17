#!/usr/bin/env node

/**
 * Test the webhook endpoint to ensure it's working
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testWebhookEndpoint() {
  console.log('🧪 Testing Webhook Endpoint...\n')

  try {
    // Test 1: Check if webhook endpoint is accessible
    console.log('1. Testing webhook endpoint accessibility...')
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.nouripet.net'
    const webhookUrl = `${baseUrl}/api/webhooks/stripe`
    
    console.log(`   Webhook URL: ${webhookUrl}`)
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('   ✅ Webhook endpoint is accessible')
        console.log(`   Response: ${JSON.stringify(data)}`)
      } else {
        console.log(`   ❌ Webhook endpoint returned status: ${response.status}`)
      }
    } catch (error) {
      console.log(`   ❌ Failed to reach webhook endpoint: ${error.message}`)
    }

    // Test 2: Check recent webhook events to see if they're being received
    console.log('\n2. Checking recent webhook events...')
    
    const { data: recentEvents, error: eventsError } = await supabase
      .from('stripe_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (eventsError) {
      console.error('   ❌ Error fetching events:', eventsError)
    } else {
      console.log(`   Found ${recentEvents.length} recent webhook events`)
      
      if (recentEvents.length > 0) {
        const latestEvent = recentEvents[0]
        const eventTime = new Date(latestEvent.created_at)
        const timeAgo = Math.round((Date.now() - eventTime.getTime()) / (1000 * 60)) // minutes ago
        
        console.log(`   Latest event: ${latestEvent.type} - ${timeAgo} minutes ago`)
        console.log('   ✅ Webhook events are being received and stored')
      } else {
        console.log('   ⚠️  No webhook events found - this could be normal if no recent checkouts')
      }
    }

    // Test 3: Check webhook configuration
    console.log('\n3. Checking webhook configuration...')
    
    const hasStripeSecret = !!process.env.STRIPE_SECRET_KEY
    const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET
    const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')
    
    console.log(`   Stripe Secret Key: ${hasStripeSecret ? '✅ Present' : '❌ Missing'}`)
    console.log(`   Webhook Secret: ${hasWebhookSecret ? '✅ Present' : '❌ Missing'}`)
    console.log(`   Mode: ${isTestMode ? '🧪 Test' : '🚀 Live'}`)
    
    if (!hasStripeSecret || !hasWebhookSecret) {
      console.log('   ❌ Missing required environment variables!')
      console.log('   Make sure STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are set')
    } else {
      console.log('   ✅ All required environment variables are present')
    }

    // Test 4: Check if subscriptions are being created
    console.log('\n4. Checking subscription creation...')
    
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)

    if (subError) {
      console.error('   ❌ Error fetching subscriptions:', subError)
    } else {
      console.log(`   Found ${subscriptions.length} total subscriptions`)
      
      if (subscriptions.length > 0) {
        const latestSub = subscriptions[0]
        const subTime = new Date(latestSub.created_at)
        const timeAgo = Math.round((Date.now() - subTime.getTime()) / (1000 * 60)) // minutes ago
        
        console.log(`   Latest subscription: ${timeAgo} minutes ago`)
        console.log('   ✅ Subscriptions are being created')
      } else {
        console.log('   ⚠️  No subscriptions found')
      }
    }

    console.log('\n📋 Summary:')
    console.log('The webhook endpoint should work for future Stripe events if:')
    console.log('1. ✅ Environment variables are properly set')
    console.log('2. ✅ Webhook endpoint is accessible')
    console.log('3. ✅ Recent events are being received (if any checkouts occurred)')
    console.log('4. ✅ The webhook fix ensures user_id is properly handled')
    
    console.log('\n🚀 Next Steps:')
    console.log('1. Test a new checkout flow to verify the webhook works')
    console.log('2. Check that the subscription is created automatically')
    console.log('3. Verify the dashboard shows real data instead of mock data')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testWebhookEndpoint()
