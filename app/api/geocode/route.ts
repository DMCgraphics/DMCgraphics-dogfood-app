import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")

  if (!address) {
    return NextResponse.json({ error: "Address parameter is required" }, { status: 400 })
  }

  const serverApiKey = process.env.GOOGLE_MAPS_SERVER_KEY

  if (!serverApiKey) {
    return NextResponse.json({ error: "Geocoding service not configured" }, { status: 500 })
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${serverApiKey}`,
    )

    if (!response.ok) {
      throw new Error("Geocoding API request failed")
    }

    const data = await response.json()

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }

    const result = data.results[0]
    const { lat, lng } = result.geometry.location

    return NextResponse.json({
      lat,
      lng,
      formattedAddress: result.formatted_address,
    })
  } catch (error) {
    console.error("Geocoding error:", error)
    return NextResponse.json({ error: "Geocoding service unavailable" }, { status: 500 })
  }
}
