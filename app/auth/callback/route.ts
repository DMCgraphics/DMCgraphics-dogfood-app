import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") ?? "/dashboard"
  const type = requestUrl.searchParams.get("type")

  console.log("Auth callback received:", { code: code?.substring(0, 8) + "...", type, next })

  if (code) {
    const supabase = await createServerSupabase()

    // Exchange code for session (works for signup, login, and recovery)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.session) {
      console.log("Auth successful, user confirmed:", data.user?.email)

      // Check if this is a password recovery
      if (type === "recovery" || next.includes("reset-password")) {
        return NextResponse.redirect(`${requestUrl.origin}/auth/reset-password`)
      }

      // For email confirmations after signup, go to dashboard with success message
      if (type === "signup" || type === "email") {
        return NextResponse.redirect(`${requestUrl.origin}/dashboard?verified=true`)
      }

      // Default: go to next or dashboard
      const nextUrl = next === "/dashboard" ? `${requestUrl.origin}/dashboard?verified=true` : `${requestUrl.origin}${next}`
      return NextResponse.redirect(nextUrl)
    }

    console.error("Auth failed:", error)
    // Return error details to the error page
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/auth-code-error?error_description=${encodeURIComponent(error?.message || "Authentication failed")}`
    )
  }

  // No code provided
  return NextResponse.redirect(
    `${requestUrl.origin}/auth/auth-code-error?error_description=${encodeURIComponent("No authentication code provided")}`
  )
}
