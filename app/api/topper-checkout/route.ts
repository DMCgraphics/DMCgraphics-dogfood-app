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

    const { priceId, dogId, dogName, dogSize, productType, recipes, isSubscription, deliveryZipcode } = await req.json()

    // Debug logging
    console.log("[TOPPER CHECKOUT] Creating checkout session for:", {
      priceId,
      dogId,
      dogName,
      dogSize,
      productType,
      recipes,
      isSubscription,
      userEmail: user.email
    })

    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID is required" },
        { status: 400 }
      )
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?checkout=cancelled`,
      metadata: {
        user_id: user.id,
        dog_id: dogId || '',
        dog_name: dogName || '',
        dog_size: dogSize || '',
        product_type: productType,
        recipes: recipes && recipes.length > 0 ? JSON.stringify(recipes) : '',
      },
      // For one-time payments, we need to pass metadata to the payment intent
      payment_intent_data: !isSubscription ? {
        metadata: {
          user_id: user.id,
          dog_id: dogId || '',
          dog_name: dogName || '',
          dog_size: dogSize || '',
          product_type: productType,
          recipes: recipes && recipes.length > 0 ? JSON.stringify(recipes) : '',
          delivery_zipcode: deliveryZipcode || '',
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
      amount_total: session.amount_total
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
