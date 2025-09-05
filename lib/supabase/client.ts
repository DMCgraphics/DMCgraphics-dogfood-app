"use client"

import { createBrowserClient } from "@supabase/ssr"

function getPlanToken() {
  try {
    return typeof window !== "undefined" ? localStorage.getItem("x-plan-token") : null
  } catch {
    return null
  }
}

export function createClient() {
  const headers: Record<string, string> = {}
  const token = getPlanToken()
  if (token) headers["x-plan-token"] = token

  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers },
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
}

export const supabase = createClient()
