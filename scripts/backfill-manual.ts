/**
 * Manual backfill script - fetches specific order sessions and updates addresses
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
  'cs_live_a1nHtW1vTss8I5BaEQEOulZ0yirRNIXs578jPBHyimfdqOVNPeeCaAj2WCE',
  'cs_live_a1tdr5j11xohyVsoR6vRNeqBCpD1uksYkSyUWNW0PzLku90YcJR0KmGzib',
  'cs_live_a1ol20UVcfphvxRwm3Yws5o1Ig8cAYMKBpp6fGVlV9Y6yY0fRmsEjrkNo6',
  'cs_live_a1qLPvNwPMCYi7w9uD5ki58AWMfhVyKK8EFXqBX8bH63SQWV3SFKVzvypv',
]

async function main() {
  console.log('Fetching addresses from Stripe...\n')

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
