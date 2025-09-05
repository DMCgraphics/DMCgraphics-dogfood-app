const raw =
  process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000" // fallback for development

export const SITE_URL = raw.replace(/\/$/, "") // strip trailing slash

export const STRIPE_SUCCESS_URL = process.env.STRIPE_SUCCESS_URL || `${SITE_URL}/checkout/success`

export const STRIPE_CANCEL_URL = process.env.STRIPE_CANCEL_URL || `${SITE_URL}/checkout/cancel`
