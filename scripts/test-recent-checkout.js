#!/usr/bin/env node

/**
 * Test subscription creation with a recent checkout session
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testRecentCheckout() {
  console.log('🧪 Testing subscription creation with recent checkout...\n')

  try {
    // Get the most recent webhook event
    const { data: events, error: eventsError } = await supabase
      .from('stripe_events')
      .select('payload')
      .eq('type', 'checkout.session.completed')
      .order('created_at', { ascending: false })
      .limit(1)

    if (eventsError || !events || events.length === 0) {
      console.log('❌ No recent checkout events found')
      return
    }

    const event = events[0]
    const sessionId = event.payload?.data?.object?.id

    if (!sessionId) {
      console.log('❌ Could not extract session ID from event')
      return
    }

    console.log('📋 Found recent checkout session:', sessionId)
    console.log('🔧 Testing subscription creation...')

    // Test the verify-payment endpoint
    const response = await fetch('http://localhost:3000/api/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Verify payment result:', result)
    } else {
      const error = await response.text()
      console.log('❌ Verify payment failed:', error)
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message)
    console.log('\n💡 This is expected if the app is not running locally.')
    console.log('   Try testing with a real checkout flow instead.')
  }
}

testRecentCheckout()
