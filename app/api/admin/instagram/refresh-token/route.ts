import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Refresh Instagram Access Token
 *
 * To use this endpoint:
 * 1. Get your Facebook App credentials from https://developers.facebook.com/apps
 * 2. Call this endpoint with client_id and client_secret
 * 3. Update INSTAGRAM_ACCESS_TOKEN in Vercel with the new token
 */
export async function POST(request: Request) {
  try {
    const { client_id, client_secret } = await request.json()

    if (!client_id || !client_secret) {
      return NextResponse.json(
        { error: "client_id and client_secret are required" },
        { status: 400 }
      )
    }

    const currentToken = process.env.INSTAGRAM_ACCESS_TOKEN

    if (!currentToken) {
      return NextResponse.json(
        { error: "INSTAGRAM_ACCESS_TOKEN not set in environment" },
        { status: 400 }
      )
    }

    // Exchange short-lived token for long-lived token
    const url = `https://graph.facebook.com/v24.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${client_id}&client_secret=${client_secret}&fb_exchange_token=${currentToken}`

    const response = await fetch(url)

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.error?.message || "Failed to refresh token" },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      access_token: data.access_token,
      expires_in: data.expires_in,
      message: "Token refreshed successfully. Update INSTAGRAM_ACCESS_TOKEN in Vercel with this new token.",
    })
  } catch (error) {
    console.error("Token refresh error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Token refresh failed" },
      { status: 500 }
    )
  }
}
