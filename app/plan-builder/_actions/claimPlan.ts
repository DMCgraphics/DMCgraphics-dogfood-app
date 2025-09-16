"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies, headers } from "next/headers"

function createServerSupabase() {
  const cookieStore = cookies()
  const h = headers()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: () => {},
      remove: () => {},
    },
    global: {
      headers: { "x-plan-token": h.get("x-plan-token") ?? "" },
    },
  })
}

export async function claimGuestPlan() {
  try {
    const sb = createServerSupabase()
    const planToken = headers().get("x-plan-token")

    if (!planToken) {
      console.log("[v0] No plan token found, skipping claim")
      return
    }

    // Get current authenticated user
    const {
      data: { user },
      error: userError,
    } = await sb.auth.getUser()

    if (userError || !user) {
      console.error("[v0] No authenticated user found for plan claim:", userError)
      return
    }

    console.log("[v0] Claiming guest plan for user:", user.id)

    const { error: claimError } = await sb
      .from("plans")
      .update({ user_id: user.id, claim_token: null })
      .eq("claim_token", planToken)

    if (claimError) {
      console.error("[v0] Error claiming guest plan:", claimError)
      return
    }

    console.log("[v0] Successfully claimed guest plan")
  } catch (error) {
    console.error("[v0] Error in claimGuestPlan:", error)
  }
}
