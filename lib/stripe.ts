// lib/stripe.ts
import Stripe from "stripe"

let stripeInstance: Stripe | null = null

export const getStripe = () => {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required")
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2024-06-20",
    })
  }
  return stripeInstance
}

// Lazy initialization for build-time safety
export const stripe = new Proxy({} as Stripe, {
  get(target, prop) {
    return getStripe()[prop as keyof Stripe]
  }
})
