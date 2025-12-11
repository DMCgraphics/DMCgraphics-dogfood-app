/**
 * Script to backfill delivery addresses for existing orders from Stripe checkout sessions
 * Run with: npx tsx scripts/backfill-order-addresses.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Load .env.local from project root
config({ path: resolve(__dirname, '../.env.local') })

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY not found in environment')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function backfillAddresses() {
  console.log('Starting address backfill...')

  // Get all orders with zipcode but no address line1
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_number, stripe_session_id')
    .not('delivery_zipcode', 'is', null)
    .is('delivery_address_line1', null)
    .not('stripe_session_id', 'is', null)

  if (error) {
    console.error('Error fetching orders:', error)
    return
  }

  console.log(`Found ${orders?.length || 0} orders to backfill`)

  let updated = 0
  let failed = 0

  for (const order of orders || []) {
    try {
      console.log(`\nProcessing ${order.order_number}...`)

      // Fetch the checkout session from Stripe
      const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id)

      // Get shipping address
      const address = session.shipping_details?.address || session.customer_details?.address

      if (!address) {
        console.log(`  No address found in Stripe session`)
        failed++
        continue
      }

      // Update the order with address details
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          delivery_address_line1: address.line1,
          delivery_address_line2: address.line2,
          delivery_city: address.city,
          delivery_state: address.state,
        })
        .eq('id', order.id)

      if (updateError) {
        console.error(`  Error updating order:`, updateError)
        failed++
      } else {
        console.log(`  ✓ Updated: ${address.line1}, ${address.city}, ${address.state}`)
        updated++
      }

      // Rate limit: wait 100ms between requests to avoid hitting Stripe limits
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (err: any) {
      console.error(`  Error processing order:`, err.message)
      failed++
    }
  }

  console.log('\n=== Backfill Complete ===')
  console.log(`Updated: ${updated}`)
  console.log(`Failed: ${failed}`)
  console.log(`Total: ${orders?.length || 0}`)
}

backfillAddresses().catch(console.error)
