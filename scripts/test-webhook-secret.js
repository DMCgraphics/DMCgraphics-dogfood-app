#!/usr/bin/env node

/**
 * Test if the webhook secret is properly configured
 */

const { createClient } = require('@supabase/supabase-js')

// Use environment variables - set these in your .env.local file
// Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testWebhookSecret() {
  console.log('🔍 Testing Webhook Secret Configuration...\n')

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET environment variable not set')
      return
    }

    console.log('📋 Webhook Secret Information:')
    console.log(`   Secret: ${webhookSecret}`)
    console.log(`   Length: ${webhookSecret.length} characters`)
    console.log(`   Starts with: ${webhookSecret.substring(0, 5)}...`)
    console.log(`   Ends with: ...${webhookSecret.substring(webhookSecret.length - 5)}`)

    // Test if we can make a request to the webhook endpoint with proper headers
    console.log('\n🧪 Testing Webhook Endpoint with Secret...')
    
    const webhookUrl = 'https://www.nouripet.net/api/webhooks/stripe'
    
    // Create a test payload (simplified checkout.session.completed event)
    const testPayload = JSON.stringify({
      id: 'evt_test_webhook_secret',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_webhook_secret',
          object: 'checkout.session',
          status: 'complete',
          payment_status: 'paid',
          subscription: 'sub_test_webhook_secret',
          metadata: {
            plan_id: 'test-plan-id',
            user_id: 'test-user-id'
          }
        }
      }
    })

    // Create a test signature (this is a simplified test)
    const crypto = require('crypto')
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(timestamp + '.' + testPayload)
      .digest('hex')

    const stripeSignature = `t=${timestamp},v1=${signature}`

    console.log(`   Test Payload: ${testPayload.substring(0, 100)}...`)
    console.log(`   Test Signature: ${stripeSignature.substring(0, 50)}...`)

    // Test the webhook endpoint
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Stripe-Signature': stripeSignature,
        },
        body: testPayload,
      })

      console.log(`   Response Status: ${response.status}`)
      const responseText = await response.text()
      console.log(`   Response: ${responseText}`)

      if (response.status === 200) {
        console.log('   ✅ Webhook endpoint is accessible and responding')
      } else {
        console.log('   ⚠️  Webhook endpoint returned non-200 status')
      }

    } catch (error) {
      console.log(`   ❌ Error testing webhook: ${error.message}`)
    }

    console.log('\n📋 Next Steps:')
    console.log('1. Verify the webhook secret is set in your production environment variables')
    console.log('2. Check that STRIPE_WEBHOOK_SECRET matches the secret from Stripe dashboard')
    console.log('3. Ensure the webhook endpoint is configured to listen for checkout.session.completed events')
    console.log('4. Test a real checkout to see if webhook events are received')

    console.log('\n🔧 Environment Variable Check:')
    console.log('Make sure your production environment has:')
    console.log(`   STRIPE_WEBHOOK_SECRET=${webhookSecret}`)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testWebhookSecret()
