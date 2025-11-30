import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { items } = await req.json()

    // Debug logging
    console.log("[CART CHECKOUT] Creating checkout session for cart items:", {
      itemsCount: items?.length,
      items: items,
      userEmail: user.email
    })

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      )
    }

    // Map cart items to Stripe price IDs
    // Detect environment based on URL or Stripe key
    const isProduction = process.env.NEXT_PUBLIC_APP_URL?.includes('nouripet.net') ||
                        process.env.STRIPE_SECRET_KEY?.startsWith('sk_live')

    // Test mode: price_1STtdA0R4BbWwBbf9G5uIXl3 (single), price_1SZGBZ0R4BbWwBbf1Vgv8Cd3 (3-pack)
    // Prod mode: price_1SL20Q0WbfuHe9kA8HUhNY1T (single), price_1SZGBy0WbfuHe9kAZen2JI5A (3-pack)
    const SINGLE_PACK_PRICE_ID = isProduction
      ? 'price_1SL20Q0WbfuHe9kA8HUhNY1T'
      : 'price_1STtdA0R4BbWwBbf9G5uIXl3'
    const THREE_PACK_PRICE_ID = isProduction
      ? 'price_1SZGBy0WbfuHe9kAZen2JI5A'
      : 'price_1SZGBZ0R4BbWwBbf1Vgv8Cd3'

    // Create a separate payment intent for EACH cart item so we can track recipes properly
    // This approach creates individual checkout sessions for each item
    // But since we want one checkout, we'll store all items as JSON in metadata

    // Build a compact representation of cart items with recipe names
    const cartItemsForMetadata = items.map((item: any, index: number) => ({
      index,
      type: item.type,
      recipes: item.recipes.map((r: any) => ({
        id: r.id,
        name: r.name
      })),
      qty: item.quantity,
      price: item.price
    }))

    // Create line items for Stripe
    const lineItems = items.map((item: any) => {
      const priceId = item.type === "single-pack" ? SINGLE_PACK_PRICE_ID : THREE_PACK_PRICE_ID
      return {
        price: priceId,
        quantity: item.quantity,
      }
    })

    // Create metadata - store cart items as JSON
    const cartMetadata = {
      user_id: user.id,
      product_type: 'cart', // Indicates this is a cart purchase (multiple items)
      item_count: items.length.toString(),
      // Store cart items as separate metadata fields to avoid 500 char limit
      items_json: JSON.stringify(cartItemsForMetadata),
    }

    console.log("[CART CHECKOUT] Cart metadata:", cartMetadata)
    console.log("[CART CHECKOUT] Items JSON length:", cartMetadata.items_json.length)

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: lineItems,
      mode: "payment", // One-time payment for individual/3-pack purchases
      // Collect shipping address for physical product delivery
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      // Also collect billing address
      billing_address_collection: 'required',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shop/individual-packs?checkout=cancelled`,
      metadata: cartMetadata,
      // For one-time payments, we need to pass metadata to the payment intent
      payment_intent_data: {
        metadata: cartMetadata,
      },
    })

    console.log("[CART CHECKOUT] Checkout session created:", {
      sessionId: session.id,
      url: session.url,
      mode: session.mode,
      amount_total: session.amount_total,
      line_items_count: lineItems.length
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error: any) {
    console.error("Error creating cart checkout session:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
