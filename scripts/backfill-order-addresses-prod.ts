/**
 * Script to backfill delivery addresses for PRODUCTION orders from Stripe checkout sessions
 * Run with: npx tsx scripts/backfill-order-addresses-prod.ts
 *
 * NOTE: This uses PRODUCTION Stripe and Supabase - be careful!
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'

// Load .env.local from project root
config({ path: resolve(__dirname, '../.env.local') })

// Prompt for confirmation since this is production
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

async function confirm(): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question('This will modify PRODUCTION data. Are you sure? (yes/no): ', (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'yes')
    })
  })
}

async function main() {
  console.log('=== PRODUCTION Address Backfill ===\n')

  const confirmed = await confirm()
  if (!confirmed) {
    console.log('Cancelled.')
    return
  }

  // Get production credentials
  const stripeKey = process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!stripeKey || !supabaseUrl || !supabaseKey) {
    console.error('Missing required environment variables')
    return
  }

  // Check if using live Stripe key
  if (!stripeKey.startsWith('sk_live_')) {
    console.error('Warning: Not using live Stripe key. Using:', stripeKey.substring(0, 10) + '...')
    console.error('Set STRIPE_SECRET_KEY_LIVE in .env.local for production')
    return
  }

  console.log('Using Stripe key:', stripeKey.substring(0, 15) + '...')
  console.log('Using Supabase:', supabaseUrl)
  console.log()

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2024-11-20.acacia',
  })

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('Fetching orders that need address backfill...')

  // Get all orders with zipcode but no address line1
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_number, stripe_session_id')
    .not('delivery_zipcode', 'is', null)
    .is('delivery_address_line1', null)
    .not('stripe_session_id', 'is', null)
    .limit(100)

  if (error) {
    console.error('Error fetching orders:', error)
    return
  }

  console.log(`Found ${orders?.length || 0} orders to backfill\n`)

  let updated = 0
  let failed = 0
  let skipped = 0

  for (const order of orders || []) {
    try {
      process.stdout.write(`Processing ${order.order_number}... `)

      // Fetch the checkout session from Stripe
      const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id)

      // Get shipping address
      const address = session.shipping_details?.address || session.customer_details?.address

      if (!address || !address.line1) {
        console.log('No address found')
        skipped++
        continue
      }

      // Update the order with address details
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          delivery_address_line1: address.line1 || null,
          delivery_address_line2: address.line2 || null,
          delivery_city: address.city || null,
          delivery_state: address.state || null,
        })
        .eq('id', order.id)

      if (updateError) {
        console.log(`ERROR: ${updateError.message}`)
        failed++
      } else {
        console.log(`✓ ${address.line1}, ${address.city}, ${address.state}`)
        updated++
      }

      // Rate limit: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (err: any) {
      console.log(`ERROR: ${err.message}`)
      failed++
    }
  }

  console.log('\n=== Backfill Complete ===')
  console.log(`Updated: ${updated}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Failed: ${failed}`)
  console.log(`Total: ${orders?.length || 0}`)
}

main().catch(console.error)
