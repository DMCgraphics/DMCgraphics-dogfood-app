// app/api/checkout/session/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { isAllowedZip, normalizeZip } from "@/lib/allowed-zips";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Expect the client to send a { zip, items, plan, email } minimal payload.
    const zip = normalizeZip(body?.zip);
    if (!zip || !isAllowedZip(zip)) {
      return NextResponse.json(
        { ok: false, code: "OUT_OF_ZONE", message: "Sorry! We currently deliver only to Westchester County, NY and Fairfield County, CT." },
        { status: 400 }
      );
    }

    // Build your line items from body.items / plan
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = body.lineItems ?? [];

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

    return NextResponse.json({ ok: true, url: session.url });
  } catch (err: any) {
    console.error("checkout session error", err);
    return NextResponse.json({ ok: false, code: "UNKNOWN", message: "Unable to start checkout." }, { status: 500 });
  }
}
