"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Award, Truck } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const farmLocations = [
  {
    name: "Mosner Family Brands",
    location: "Bronx, NY",
    product: "Premium Meats",
    lat: 40.8100,
    lng: -73.8800,
    color: "bg-primary",
    description: "Regional meat purveyor sourcing quality proteins. We pick up directly 1-2 days before batching",
  },
]

export function SourcingSection() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(false)

  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        console.log("[v0] Google Maps API Key available:", !!apiKey)
        console.log("[v0] API Key value:", apiKey ? `${apiKey.substring(0, 20)}...` : "undefined")
        console.log(
          "[v0] Expected new API key starts with:",
          "AIzaSyDBw5saJyqC6dmeDU9EjJ5hKscuguhtTSw".substring(0, 20),
        )

        if (!apiKey) {
          console.error("[v0] Google Maps API key not found")
          setMapError(true)
          return
        }

        window.gm_authFailure = () => {
          console.error("[v0] Google Maps authentication failed - API key may be invalid or expired")
          setMapError(true)
        }

        // Load Google Maps script
        if (!window.google) {
          console.log("[v0] Loading Google Maps script with new API key")
          const script = document.createElement("script")
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
          script.async = true
          script.defer = true

          script.onload = () => {
            console.log("[v0] Google Maps script loaded successfully")
            initializeMap()
          }

          script.onerror = () => {
            console.error("[v0] Failed to load Google Maps script")
            setMapError(true)
          }

          document.head.appendChild(script)
        } else {
          console.log("[v0] Google Maps already loaded, initializing map")
          initializeMap()
        }
      } catch (error) {
        console.error("[v0] Error loading Google Maps:", error)
        setMapError(true)
      }
    }

    const initializeMap = () => {
      if (!mapRef.current || !window.google) {
        console.error("[v0] Map ref or Google Maps not available")
        return
      }

      try {
        console.log("[v0] Initializing Google Map...")
        // Center map on NY/CT regional sourcing area
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 41.2, lng: -73.5 },
          zoom: 9,
          styles: [
            {
              featureType: "all",
              elementType: "geometry.fill",
              stylers: [{ color: "#f5f5f5" }],
            },
            {
              featureType: "water",
              elementType: "geometry.fill",
              stylers: [{ color: "#c9d6e8" }],
            },
            {
              featureType: "landscape.natural",
              elementType: "geometry.fill",
              stylers: [{ color: "#e8f5e8" }],
            },
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })

        console.log("[v0] Map created successfully, adding markers...")

        // Add markers for each farm
        farmLocations.forEach((farm, index) => {
          console.log(`[v0] Adding marker ${index + 1}: ${farm.name}`)
          const marker = new window.google.maps.Marker({
            position: { lat: farm.lat, lng: farm.lng },
            map: map,
            title: farm.name,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: farm.color === "bg-primary" ? "#22c55e" : "#f59e0b",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          })

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; max-width: 200px;">
                <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">${farm.name}</h3>
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${farm.location}</p>
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #22c55e; font-weight: 500;">${farm.product}</p>
                <p style="margin: 0; font-size: 11px; color: #888;">${farm.description}</p>
              </div>
            `,
          })

          marker.addListener("click", () => {
            infoWindow.open(map, marker)
          })
        })

        console.log("[v0] All markers added successfully")
        setMapLoaded(true)
      } catch (error) {
        console.error("[v0] Error initializing map:", error)
        setMapError(true)
      }
    }

    loadGoogleMaps()
  }, [])

  return (
    <section className="py-12 md:py-20">
      <div className="container px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start lg:items-center">
          <div className="space-y-6 md:space-y-8">
            <div className="space-y-3 md:space-y-4">
              <h2 className="font-manrope text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                Premium sourcing. <span className="text-primary block sm:inline">Local & regional partners.</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                We source premium meats from Mosner Family Brands, a trusted regional purveyor, and fresh vegetables from local and regional farms that share our commitment to quality and transparency.
              </p>
            </div>

            <div className="space-y-3 md:space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <MapPin className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm md:text-base">Regional Sourcing Network</div>
                  <div className="text-xs md:text-sm text-muted-foreground">Mosner Family Brands for meats</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <Award className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm md:text-base">Local & Regional Produce</div>
                  <div className="text-xs md:text-sm text-muted-foreground">
                    Fresh vegetables from trusted farms
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <Truck className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm md:text-base">Fresh Daily Delivery</div>
                  <div className="text-xs md:text-sm text-muted-foreground">Farm to kitchen within 24 hours</div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative w-full">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="w-full h-64 sm:h-80 md:h-96 lg:min-h-[400px] relative">
                  {!mapError ? (
                    <div ref={mapRef} className="w-full h-full" style={{ minHeight: "400px" }} />
                  ) : (
                    // Fallback to original static display if map fails
                    <div className="w-full h-full bg-gradient-to-br from-green-50 to-amber-50 p-6 flex flex-col justify-center">
                      <div className="space-y-4">
                        <div className="text-center mb-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">Our Sourcing Partners</h3>
                          <p className="text-sm text-gray-600">Regional Network</p>
                        </div>

                        <div className="space-y-3">
                          {farmLocations.map((farm, index) => (
                            <div
                              key={index}
                              className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-white/50"
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`w-3 h-3 rounded-full mt-1 ${farm.color === "bg-primary" ? "bg-green-500" : "bg-amber-500"}`}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm text-gray-800">{farm.name}</div>
                                  <div className="text-xs text-gray-600">{farm.location}</div>
                                  <div className="text-xs text-green-600 font-medium">{farm.product}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="text-center pt-4">
                          <p className="text-xs text-gray-500">Map temporarily unavailable</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="absolute -bottom-2 -left-2 md:-bottom-4 md:-left-4 bg-card border rounded-lg md:rounded-xl p-3 md:p-4 shadow-lg max-w-[180px] md:max-w-none">
              <div className="text-xs md:text-sm font-medium">Batch #NP-2024-001</div>
              <div className="text-xs text-muted-foreground">Regional sourcing</div>
              <Badge variant="outline" className="mt-1 md:mt-2 text-xs">
                View COA
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
