import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/server"

// This diagnostic endpoint helps debug Stripe mode detection issues
export async function GET() {
  try {
    // Check if user is admin
    const supabase = createServerSupabase()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get environment variable values
    const secretKey = process.env.STRIPE_SECRET_KEY || "NOT_SET"
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "NOT_SET"

    // Check test mode detection
    const isTestMode = secretKey?.startsWith('sk_test_') ?? true

    // Get a sample from the pricing object that would be used
    const { getStripePricing } = await import("@/lib/stripe-pricing")
    const pricing = getStripePricing()
    const beefPricing = pricing["beef-quinoa-harvest"]?.[0]

    return NextResponse.json({
      environment: process.env.NODE_ENV,
      stripe: {
        secretKeyPrefix: secretKey.substring(0, 10) + "...",
        secretKeyStartsWithTest: secretKey.startsWith('sk_test_'),
        secretKeyStartsWithLive: secretKey.startsWith('sk_live_'),
        publishableKey: publishableKey,
        publishableKeyStartsWithTest: publishableKey.startsWith('pk_test_'),
        publishableKeyStartsWithLive: publishableKey.startsWith('pk_live_'),
        isTestMode: isTestMode,
      },
      samplePricing: {
        recipe: "beef-quinoa-harvest (Small)",
        priceId: beefPricing?.priceId,
        productName: beefPricing?.productName,
        amountCents: beefPricing?.amountCents,
      },
      diagnosis: {
        expectedMode: secretKey.startsWith('sk_live_') ? "LIVE" : "TEST",
        actualMode: isTestMode ? "TEST" : "LIVE",
        issue: secretKey.startsWith('sk_live_') && isTestMode
          ? "Environment variables show LIVE keys but isTestMode() returns TRUE - this is the bug!"
          : secretKey.startsWith('sk_test_') && !isTestMode
          ? "Environment variables show TEST keys but isTestMode() returns FALSE"
          : "Mode detection is working correctly"
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get diagnostic info" },
      { status: 500 }
    )
  }
}
