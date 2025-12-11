/**
 * Backfill remaining orders
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import Stripe from 'stripe'

config({ path: resolve(__dirname, '../.env.local') })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_LIVE!, {
  apiVersion: '2024-11-20.acacia',
})

const sessionIds = [
  'cs_live_a1ckcu2lMr65Y5CWmQddUZiZjDSdd9NJI44LUlo33dO6vcZ1n7JOIKFf7i',
  'cs_live_a173mOev0Xq7IVkcclXlCotpjupJJ2mbqLs9ePqv5PlLgzC6Ab9aMbxlT5',
  'cs_live_a1X2ty44XrEB7PwpC4KbwfBrnXu9MxXixelcWbB0NRZLGenumFZZZ1b4co',
]

async function main() {
  console.log('Fetching remaining addresses from Stripe...\n')

  for (const sessionId of sessionIds) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      const address = session.shipping_details?.address || session.customer_details?.address

      if (address) {
        console.log(`${sessionId}:`)
        console.log(`  Line 1: ${address.line1}`)
        console.log(`  Line 2: ${address.line2 || 'N/A'}`)
        console.log(`  City: ${address.city}`)
        console.log(`  State: ${address.state}`)
        console.log(`  Zip: ${address.postal_code}`)
        console.log()
      } else {
        console.log(`${sessionId}: No address found`)
        console.log()
      }

      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (err: any) {
      console.error(`Error fetching ${sessionId}:`, err.message)
    }
  }
}

main().catch(console.error)
