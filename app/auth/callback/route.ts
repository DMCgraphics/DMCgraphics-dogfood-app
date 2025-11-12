import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") ?? "/"
  const type = requestUrl.searchParams.get("type")

  console.log("Auth callback received:", { code: code?.substring(0, 8) + "...", type, next })

  if (code) {
    const supabase = createServerSupabase()
    let data, error, isRecovery = false

    // Try password recovery first (verifyOtp doesn't require PKCE code_verifier)
    const recoveryResult = await supabase.auth.verifyOtp({
      type: "recovery",
      token_hash: code,
    })

    if (!recoveryResult.error) {
      console.log("Password recovery verified successfully")
      data = recoveryResult.data
      isRecovery = true
    } else if (recoveryResult.error.message?.includes("otp_expired") ||
               recoveryResult.error.message?.includes("invalid")) {
      // If recovery fails, try regular code exchange (for signup/login)
      console.log("Not a recovery code, trying regular code exchange")
      const codeResult = await supabase.auth.exchangeCodeForSession(code)
      data = codeResult.data
      error = codeResult.error
    } else {
      // Some other error occurred
      error = recoveryResult.error
    }

    if (!error && data) {
      console.log("Auth successful, redirecting. IsRecovery:", isRecovery)

      if (isRecovery || type === "recovery" || next.includes("reset-password")) {
        return NextResponse.redirect(`${requestUrl.origin}/auth/reset-password`)
      }
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
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
