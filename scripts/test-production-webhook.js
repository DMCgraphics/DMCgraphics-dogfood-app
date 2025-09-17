#!/usr/bin/env node

/**
 * Test the production webhook endpoint
 */

async function testProductionWebhook() {
  console.log('🧪 Testing Production Webhook Endpoint...\n')

  try {
    // Test the correct production URL
    const webhookUrl = 'https://www.nouripet.net/api/webhooks/stripe'
    
    console.log(`Testing webhook URL: ${webhookUrl}`)
    
    const response = await fetch(webhookUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Production webhook endpoint is accessible!')
      console.log(`Response: ${JSON.stringify(data)}`)
      console.log('\n🎯 This is the URL you should use in your Stripe webhook configuration!')
    } else {
      console.log(`❌ Production webhook endpoint returned status: ${response.status}`)
      console.log(`Response: ${await response.text()}`)
    }

    // Test the failing URLs for comparison
    console.log('\n🔍 Testing the failing URLs for comparison...')
    
    const failingUrls = [
      'https://nouripet-app-git-main-dylan-cohens-projects.vercel.app/api/webhooks/stripe',
      'https://nouripet.net/api/webhooks/stripe'
    ]
    
    for (const url of failingUrls) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        console.log(`\n${url}:`)
        console.log(`  Status: ${response.status}`)
        if (response.status === 401) {
          console.log('  ❌ 401 Unauthorized - This URL requires authentication')
        } else if (response.status === 308) {
          console.log('  ❌ 308 Redirect - This URL is redirecting')
        } else {
          console.log(`  Response: ${await response.text()}`)
        }
      } catch (error) {
        console.log(`\n${url}:`)
        console.log(`  ❌ Error: ${error.message}`)
      }
    }

    console.log('\n📋 Summary:')
    console.log('✅ Use: https://www.nouripet.net/api/webhooks/stripe')
    console.log('❌ Don\'t use: https://nouripet-app-git-main-dylan-cohens-projects.vercel.app/api/webhooks/stripe (401 error)')
    console.log('❌ Don\'t use: https://nouripet.net/api/webhooks/stripe (308 redirect)')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testProductionWebhook()
