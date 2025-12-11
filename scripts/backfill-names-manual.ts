/**
 * Manual backfill of customer names
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import Stripe from 'stripe'

config({ path: resolve(__dirname, '../.env.local') })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_LIVE!, {
  apiVersion: '2024-11-20.acacia',
})

const sessionIds = [
  'cs_live_a1jV4iGuxYGhnazPzwxZ4bQXijDan6sHV51IawaGFM7XcIt9uc7GvGgURH',
  'cs_live_a1tdr5j11xohyVsoR6vRNeqBCpD1uksYkSyUWNW0PzLku90YcJR0KmGzib',
  'cs_live_a1ol20UVcfphvxRwm3Yws5o1Ig8cAYMKBpp6fGVlV9Y6yY0fRmsEjrkNo6',
  'cs_live_a1qLPvNwPMCYi7w9uD5ki58AWMfhVyKK8EFXqBX8bH63SQWV3SFKVzvypv',
  'cs_live_a1ckcu2lMr65Y5CWmQddUZiZjDSdd9NJI44LUlo33dO6vcZ1n7JOIKFf7i',
  'cs_live_a173mOev0Xq7IVkcclXlCotpjupJJ2mbqLs9ePqv5PlLgzC6Ab9aMbxlT5',
  'cs_live_a1X2ty44XrEB7PwpC4KbwfBrnXu9MxXixelcWbB0NRZLGenumFZZZ1b4co',
]

async function main() {
  console.log('Fetching customer names from Stripe...\n')

  for (const sessionId of sessionIds) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      const customerName = session.customer_details?.name || session.shipping_details?.name

      console.log(`${sessionId}:`)
      console.log(`  Customer: ${customerName || 'Not found'}`)
      console.log()

      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (err: any) {
      console.error(`Error fetching ${sessionId}:`, err.message)
    }
  }
}

main().catch(console.error)
