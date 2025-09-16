import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")

  if (!query || query.length < 3) {
    return NextResponse.json({ suggestions: [] })
  }

  const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY
  if (!apiKey) {
    console.error("GOOGLE_MAPS_SERVER_KEY not found")
    return NextResponse.json({ suggestions: [] })
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=address&key=${apiKey}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status === "OK") {
      const suggestions = data.predictions.map((prediction: any) => prediction.description)
      return NextResponse.json({ suggestions })
    } else {
      console.error("Google Places API error:", data.status, data.error_message)
      return NextResponse.json({ suggestions: [] })
    }
  } catch (error) {
    console.error("Error fetching address suggestions:", error)
    return NextResponse.json({ suggestions: [] })
  }
}
