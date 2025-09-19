// app/api/checkout/session/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { isAllowedZip, normalizeZip } from "@/lib/allowed-zips";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[checkout-session] Request body:", JSON.stringify(body, null, 2));
    
    // Expect the client to send a { zip, items, plan, email } minimal payload.
    const zip = normalizeZip(body?.zip);
    if (!zip || !isAllowedZip(zip)) {
      console.log("[checkout-session] ZIP validation failed:", zip);
      return NextResponse.json(
        { ok: false, code: "OUT_OF_ZONE", message: "Sorry! We currently deliver only to Westchester County, NY and Fairfield County, CT." },
        { status: 400 }
      );
    }

    // Build your line items from body.items / plan
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = body.lineItems ?? [];
    console.log("[checkout-session] Line items:", JSON.stringify(line_items, null, 2));
    
    if (line_items.length === 0) {
      console.log("[checkout-session] No line items provided");
      return NextResponse.json(
        { ok: false, code: "NO_ITEMS", message: "No items found in cart." },
        { status: 400 }
      );
    }

    // Validate that all line items have price IDs
    const invalidItems = line_items.filter(item => !item.price);
    if (invalidItems.length > 0) {
      console.log("[checkout-session] Some line items missing price IDs:", invalidItems);
      return NextResponse.json(
        { ok: false, code: "MISSING_PRICES", message: "Some items are missing pricing information. Please try again." },
        { status: 400 }
      );
    }

    console.log("[checkout-session] Creating Stripe session with:", {
      mode: "subscription",
      customer_email: body?.email,
      line_items_count: line_items.length,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.nouripet.net"}/order/confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.nouripet.net"}/cart`,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription", // or "payment"
      customer_email: body?.email, // optional if you create/reuse customers elsewhere
      line_items,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.nouripet.net"}/order/confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.nouripet.net"}/cart`,
      allow_promotion_codes: true,
      billing_address_collection: "required",
      shipping_address_collection: { allowed_countries: ["US"] },
      // You can also surface your prevalidated ZIP to your metadata for reconciliation:
      metadata: { prevalidated_zip: zip, plan: body?.plan ?? "" },
    });

    console.log("[checkout-session] Stripe session created successfully:", session.id);
    return NextResponse.json({ ok: true, url: session.url });
  } catch (err: any) {
    console.error("[checkout-session] Error creating Stripe session:", err);
    console.error("[checkout-session] Error details:", JSON.stringify(err, null, 2));
    return NextResponse.json({ ok: false, code: "UNKNOWN", message: "Unable to start checkout." }, { status: 500 });
  }
}
