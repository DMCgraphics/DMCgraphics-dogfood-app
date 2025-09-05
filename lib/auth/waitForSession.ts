import { supabase } from "@/lib/supabase/client"

export async function waitForSession(timeoutMs = 8000, intervalMs = 250) {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.user) {
      console.log("[v0] Session found:", session.user.id)
      return session
    }
    console.log("[v0] Waiting for session...")
    await new Promise((r) => setTimeout(r, intervalMs))
  }

  throw new Error("No authenticated user found after retries")
}
