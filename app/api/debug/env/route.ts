export const runtime = "nodejs"
import { NextResponse } from "next/server"
export function GET() {
  return NextResponse.json({
    hasSecret: !!process.env.STRIPE_SECRET_KEY,
    hasSuccess: !!process.env.STRIPE_SUCCESS_URL,
    hasCancel: !!process.env.STRIPE_CANCEL_URL,
    hasWebhook: !!process.env.STRIPE_WEBHOOK_SECRET,
    hasMetaPixelId: !!process.env.NEXT_PUBLIC_META_PIXEL_ID,
    metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || "NOT SET",
    runtime: "nodejs",
  })
}
