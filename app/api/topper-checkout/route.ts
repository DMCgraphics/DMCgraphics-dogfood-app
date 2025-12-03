import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    const { priceId, dogId, dogName, dogSize, productType, recipes, isSubscription, deliveryZipcode, guestEmail } = await req.json()

    // For subscriptions, require authentication
    if (isSubscription && !user) {
      return NextResponse.json(
        { error: "Account required for subscriptions. Please sign in or create an account." },
        { status: 401 }
      )
    }

    // For guest checkout (one-time purchases), allow without auth
    const customerEmail = user?.email || guestEmail

    // Debug logging
    console.log("[TOPPER CHECKOUT] Creating checkout session for:", {
      priceId,
      dogId,
      dogName,
      dogSize,
      productType,
      recipes,
      isSubscription,
      userEmail: customerEmail,
      userId: user?.id,
      isGuest: !user
    })

    // CRITICAL: Verify user_id for authenticated users
    if (user) {
      console.log("[TOPPER CHECKOUT] ✓ User authenticated - ID:", user.id, "Email:", user.email)
    } else {
      console.log("[TOPPER CHECKOUT] ⚠ Guest checkout - Email:", guestEmail)
    }

    // Validate that subscriptions have user_id
    if (isSubscription && !user?.id) {
      console.error("[TOPPER CHECKOUT] ❌ CRITICAL: Subscription attempted without user_id!")
      return NextResponse.json(
        { error: "Account required for subscriptions" },
        { status: 401 }
      )
    }

    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID is required" },
        { status: 400 }
      )
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: isSubscription ? "subscription" : "payment",
      // Collect shipping address for physical product delivery
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      // Also collect billing address
      billing_address_collection: 'required',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/order/success?session_id={CHECKOUT_SESSION_ID}${!user ? '&guest=true' : ''}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${user ? '/dashboard' : '/shop/individual-packs'}?checkout=cancelled`,
      metadata: {
        user_id: user?.id || '',
        dog_id: dogId || '',
        dog_name: dogName || '',
        dog_size: dogSize || '',
        product_type: productType,
        recipes: recipes && recipes.length > 0 ? JSON.stringify(recipes) : '',
        is_guest: !user ? 'true' : 'false',
      },
      // For one-time payments, we need to pass metadata to the payment intent
      payment_intent_data: !isSubscription ? {
        metadata: {
          user_id: user?.id || '',
          dog_id: dogId || '',
          dog_name: dogName || '',
          dog_size: dogSize || '',
          product_type: productType,
          recipes: recipes && recipes.length > 0 ? JSON.stringify(recipes) : '',
          delivery_zipcode: deliveryZipcode || '',
          is_guest: !user ? 'true' : 'false',
        },
      } : undefined,
      subscription_data: isSubscription ? {
        metadata: {
          user_id: user.id,
          dog_id: dogId || '',
          dog_name: dogName || '',
          dog_size: dogSize || '',
          product_type: productType,
          recipes: recipes && recipes.length > 0 ? JSON.stringify(recipes) : '',
        },
      } : undefined,
    })

    console.log("[TOPPER CHECKOUT] Checkout session created:", {
      sessionId: session.id,
      url: session.url,
      mode: session.mode,
      amount_total: session.amount_total,
      metadata: session.metadata,
      customer_email: session.customer_email
    })

    // Log metadata for debugging "Customer: Unknown" issues
    console.log("[TOPPER CHECKOUT] Session metadata:", {
      user_id: session.metadata?.user_id || "NOT SET",
      dog_id: session.metadata?.dog_id || "NOT SET",
      product_type: session.metadata?.product_type || "NOT SET",
      is_guest: session.metadata?.is_guest || "NOT SET"
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error: any) {
    console.error("Error creating topper checkout session:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
