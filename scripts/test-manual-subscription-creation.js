#!/usr/bin/env node

/**
 * Manual subscription creation test script
 * This script helps you test subscription creation by calling the API endpoint directly
 * 
 * Usage: node scripts/test-manual-subscription-creation.js <session_id>
 * 
 * You can get a session_id from:
 * 1. Stripe Dashboard > Payments > Checkout Sessions
 * 2. Your application logs during checkout
 * 3. The URL after successful checkout (session_id parameter)
 */

const https = require('https')
const http = require('http')

const sessionId = process.argv[2]

if (!sessionId) {
  console.log('❌ Please provide a session ID')
  console.log('Usage: node scripts/test-manual-subscription-creation.js <session_id>')
  console.log('\nYou can get a session_id from:')
  console.log('1. Stripe Dashboard > Payments > Checkout Sessions')
  console.log('2. Your application logs during checkout')
  console.log('3. The URL after successful checkout (session_id parameter)')
  process.exit(1)
}

console.log('🧪 Testing manual subscription creation...')
console.log('Session ID:', sessionId)
console.log('')

// Test the verify-payment endpoint first
console.log('1. Testing /api/verify-payment endpoint...')
testEndpoint('/api/verify-payment', { sessionId })
  .then(result => {
    console.log('✅ Verify payment result:', result)
    console.log('')
    
    // Then test the subscription creation endpoint
    console.log('2. Testing /api/subscriptions/create endpoint...')
    return testEndpoint('/api/subscriptions/create', { sessionId })
  })
  .then(result => {
    console.log('✅ Subscription creation result:', result)
    console.log('')
    console.log('🎉 Test completed!')
    console.log('')
    console.log('Next steps:')
    console.log('1. Check your Supabase subscriptions table for the new record')
    console.log('2. Check your application logs for any errors')
    console.log('3. If successful, test the dashboard to see if it shows the subscription')
  })
  .catch(error => {
    console.error('❌ Test failed:', error.message)
    console.log('')
    console.log('This could mean:')
    console.log('1. The session ID is invalid or expired')
    console.log('2. The payment was not completed')
    console.log('3. There\'s an issue with the API endpoint')
    console.log('4. The webhook already created the subscription')
  })

function testEndpoint(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data)
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }
    
    const req = http.request(options, (res) => {
      let responseData = ''
      
      res.on('data', (chunk) => {
        responseData += chunk
      })
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData)
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed)
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.error || responseData}`))
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseData)
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`))
          }
        }
      })
    })
    
    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`))
    })
    
    req.write(postData)
    req.end()
  })
}
