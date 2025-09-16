export const runtime = "nodejs"
export const dynamic = "force-dynamic" // prevent static evaluation

import Stripe from "stripe"
import { NextResponse } from "next/server"

type VerifyBody = { sessionId?: string }

export async function POST(req: Request) {
  const { sessionId } = (await req.json()) as VerifyBody

  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 })
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 })

  const stripe = new Stripe(secret, { apiVersion: "2024-06-20" })

  const session = await stripe.checkout.sessions.retrieve(sessionId)
  return NextResponse.json({
    status: session.payment_status,
    mode: session.mode,
  })
}

export function GET() {
  return new NextResponse("Use POST", { status: 405, headers: { Allow: "POST" } })
}
