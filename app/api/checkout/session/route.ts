// app/api/checkout/session/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Stripe from "stripe";
import { isAllowedZip, normalizeZip } from "@/lib/allowed-zips";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

function reqEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export async function POST(req: Request) {
  try {
    console.log("[checkout-session] Starting checkout session API request");

    // Authenticate user (same pattern as existing checkout API)
    const cookieStore = cookies();
    const supabase = createServerClient(reqEnv("NEXT_PUBLIC_SUPABASE_URL"), reqEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    });

    console.log("[checkout-session] Supabase client created, checking auth");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.log("[checkout-session] No authenticated user found");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.log("[checkout-session] User authenticated:", user.id);

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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.nouripet.net"}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.nouripet.net"}/cart`,
    });

    // Get plan data to include in metadata (same pattern as existing checkout API)
    const { data: plans, error: plansError } = await supabase
      .from("plans")
      .select("id, total_cents")
      .eq("user_id", user.id)
      .in("status", ["draft", "checkout_in_progress", "active"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (plansError || !plans || plans.length === 0) {
      console.log("[checkout-session] No plan found for user");
      return NextResponse.json(
        { ok: false, code: "NO_PLAN", message: "No plan found. Please complete the plan builder first." },
        { status: 400 }
      );
    }

    const planId = plans[0].id;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription", // or "payment"
      customer_email: user.email ?? undefined, // Use authenticated user's email
      line_items,
      subscription_data: {
        metadata: {
          plan_id: planId,
          user_id: user.id,
        },
      },
      client_reference_id: planId,
      metadata: { 
        plan_id: planId, 
        user_id: user.id,
        prevalidated_zip: zip, 
        plan: body?.plan ?? "" 
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.nouripet.net"}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.nouripet.net"}/cart`,
      allow_promotion_codes: true,
      billing_address_collection: "required",
      shipping_address_collection: { allowed_countries: ["US"] },
    });

    console.log("[checkout-session] Stripe session created successfully:", session.id);
    return NextResponse.json({ ok: true, url: session.url });
  } catch (err: any) {
    console.error("[checkout-session] Error creating Stripe session:", err);
    console.error("[checkout-session] Error details:", JSON.stringify(err, null, 2));
    return NextResponse.json({ ok: false, code: "UNKNOWN", message: "Unable to start checkout." }, { status: 500 });
  }
}
