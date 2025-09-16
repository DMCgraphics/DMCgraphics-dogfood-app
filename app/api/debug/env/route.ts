export const runtime = "nodejs"
import { NextResponse } from "next/server"
export function GET() {
  return NextResponse.json({
    hasSecret: !!process.env.STRIPE_SECRET_KEY,
    hasSuccess: !!process.env.STRIPE_SUCCESS_URL,
    hasCancel: !!process.env.STRIPE_CANCEL_URL,
    hasWebhook: !!process.env.STRIPE_WEBHOOK_SECRET,
    runtime: "nodejs",
  })
}
