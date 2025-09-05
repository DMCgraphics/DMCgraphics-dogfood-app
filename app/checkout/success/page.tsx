export const dynamic = "force-dynamic"

import Stripe from "stripe"
import Link from "next/link"
import { SuccessBridge } from "@/components/checkout/success-bridge"

type Props = { searchParams: { session_id?: string } }

export default async function Success({ searchParams }: Props) {
  const sessionId = searchParams?.session_id
  let email: string | null = null
  let subscriptionId: string | null = null

  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
      const s = await stripe.checkout.sessions.retrieve(sessionId)
      email = s.customer_details?.email ?? null
      subscriptionId = typeof s.subscription === "string" ? s.subscription : null
    } catch {
      // swallow – still show success UI
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <SuccessBridge subscriptionId={subscriptionId} />
      <h1 className="text-3xl font-semibold">Thanks — your order is confirmed!</h1>
      {email && <p className="mt-2 text-muted-foreground">A receipt was sent to {email}.</p>}
      {subscriptionId && <p className="mt-1 text-sm text-muted-foreground">Subscription ID: {subscriptionId}</p>}
      <div className="mt-8 flex gap-3">
        <Link className="underline" href="/dashboard">
          Go to dashboard
        </Link>
        <Link className="underline" href="/">
          Back home
        </Link>
      </div>
    </main>
  )
}
