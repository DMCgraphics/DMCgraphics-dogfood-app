// app/checkout/success/page.tsx
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { PurchaseTracker } from "@/components/tracking/purchase-tracker"

function reqEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env ${name}`)
  return v
}

export default async function SuccessPage({ searchParams }: { searchParams: { session_id?: string } }) {
  const cookieStore = cookies()
  const supabase = createServerClient(reqEnv("SUPABASE_URL"), reqEnv("SUPABASE_ANON_KEY"), {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set() {},
      remove() {},
    },
  })

  // Read the latest active or in-progress plan for this user (webhook should flip to active)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let plan
  if (user) {
    const { data } = await supabase
      .from("plans")
      .select("id,status,total_cents,updated_at,stripe_subscription_id")
      .in("status", ["active", "purchased", "checkout_in_progress"])
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    plan = data ?? null
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      {/* Track purchase completion for Meta Pixel */}
      {plan && (
        <PurchaseTracker
          value={(plan.total_cents ?? 0) / 100}
          subscriptionId={plan.stripe_subscription_id}
          planId={plan.id}
        />
      )}

      <h1 className="text-2xl font-semibold mb-2">Payment complete 🎉</h1>
      {searchParams.session_id && <p className="text-sm text-gray-500 mb-2">Session: {searchParams.session_id}</p>}
      {plan ? (
        <div className="rounded-lg border p-4">
          <p>
            Status: <b>{plan.status}</b>
          </p>
          <p>Total: ${(plan.total_cents ?? 0 / 100).toFixed(2)}</p>
          {plan.stripe_subscription_id && <p>Subscription: {plan.stripe_subscription_id}</p>}
        </div>
      ) : (
        <p>Thanks! We're finalizing your order. This page will refresh when ready.</p>
      )}
    </div>
  )
}
