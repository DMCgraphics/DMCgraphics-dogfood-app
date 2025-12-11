/**
 * Backfill customer names from Stripe checkout sessions
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

config({ path: resolve(__dirname, '../.env.local') })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_LIVE!, {
  apiVersion: '2024-11-20.acacia',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  console.log('Fetching orders that need customer names...\n')

  //Get all orders with Stripe sessions but no customer name
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_number, stripe_session_id')
    .not('stripe_session_id', 'is', null)
    .is('customer_name', null)
    .limit(100)

  if (error) {
    console.error('Error fetching orders:', error)
    return
  }

  console.log(`Found ${orders?.length || 0} orders to backfill\n`)

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const order of orders || []) {
    try {
      process.stdout.write(`Processing ${order.order_number}... `)

      const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id)
      const customerName = session.customer_details?.name || session.shipping_details?.name

      if (!customerName) {
        console.log('No customer name found')
        skipped++
        continue
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({ customer_name: customerName })
        .eq('id', order.id)

      if (updateError) {
        console.log(`ERROR: ${updateError.message}`)
        failed++
      } else {
        console.log(`✓ ${customerName}`)
        updated++
      }

      // Rate limit
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
