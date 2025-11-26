import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const { priceId, productType, recipeName, quantity } = await req.json()

    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID is required" },
        { status: 400 }
      )
    }

    // Create Stripe checkout session for guest purchase
    const session = await stripe.checkout.sessions.create({
      // Stripe will collect email and create customer
      customer_creation: 'always',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment", // One-time payment only (no subscriptions)
      // Collect shipping address for physical product delivery
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      // Also collect billing address
      billing_address_collection: 'required',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shop?checkout=cancelled`,
      metadata: {
        product_type: productType,
        recipe_name: recipeName || '',
        quantity: quantity?.toString() || '1',
        is_guest_purchase: 'true',
      },
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error: any) {
    console.error("Error creating guest checkout session:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
