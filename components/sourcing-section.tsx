"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Award, Truck } from "lucide-react"
import { useEffect, useRef, useState } from "react"

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

const farmLocations = [
  {
    name: "Sunrise Poultry Farm",
    location: "Litchfield, CT",
    product: "Free-Range Chicken",
    lat: 41.7473,
    lng: -73.189,
    color: "bg-primary",
    description: "Family-owned farm specializing in pasture-raised poultry since 1952",
  },
  {
    name: "Hudson Valley Beef Co",
    location: "Rhinebeck, NY",
    product: "Grass-Fed Beef",
    lat: 41.927,
    lng: -73.9123,
    color: "bg-secondary",
    description: "Sustainable grass-fed cattle ranch in the heart of Hudson Valley",
  },
  {
    name: "Connecticut Turkey Ranch",
    location: "Woodstock, CT",
    product: "Heritage Turkey",
    lat: 41.9501,
    lng: -71.9673,
    color: "bg-primary",
    description: "Heritage breed turkeys raised on open pastures with traditional methods",
  },
]

export function SourcingSection() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !window.google) {
        setMapError("Google Maps failed to load")
        return
      }

      try {
        const map = new window.google.maps.Map(mapRef.current, {
          zoom: 8,
          center: { lat: 41.8, lng: -73.0 }, // Center on CT/Hudson Valley region
          styles: [
            {
              featureType: "all",
              elementType: "geometry.fill",
              stylers: [{ color: "#f8fafc" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#e2e8f0" }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#ffffff" }],
            },
            {
              featureType: "landscape",
              elementType: "geometry",
              stylers: [{ color: "#f1f5f9" }],
            },
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        })

        // Add markers for each farm
        farmLocations.forEach((farm, index) => {
          const marker = new window.google.maps.Marker({
            position: { lat: farm.lat, lng: farm.lng },
            map: map,
            title: `${farm.name} - ${farm.product}`,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: farm.color === "bg-primary" ? "#22c55e" : "#f59e0b",
              fillOpacity: 0.9,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            },
            animation: window.google.maps.Animation.DROP,
          })

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div class="p-3 max-w-xs">
                <h3 class="font-semibold text-lg mb-1">${farm.name}</h3>
                <p class="text-sm text-gray-600 mb-2">${farm.location}</p>
                <p class="text-sm font-medium text-green-600 mb-2">${farm.product}</p>
                <p class="text-xs text-gray-500">${farm.description}</p>
              </div>
            `,
          })

          marker.addListener("click", () => {
            infoWindow.open(map, marker)
          })
        })

        setMapLoaded(true)
        setMapError(null)
      } catch (error) {
        console.error("Error initializing map:", error)
        setMapError("Failed to initialize map")
      }
    }

    if (!window.google) {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        setMapError("Google Maps API key not configured")
        return
      }

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&libraries=geometry`
      script.async = true
      script.defer = true

      script.onerror = () => {
        setMapError("Failed to load Google Maps API")
      }

      window.initMap = initMap
      document.head.appendChild(script)
    } else {
      initMap()
    }

    return () => {
      if (window.initMap) {
        delete window.initMap
      }
    }
  }, [])

  return (
    <section className="py-12 md:py-20">
      <div className="container px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start lg:items-center">
          <div className="space-y-6 md:space-y-8">
            <div className="space-y-3 md:space-y-4">
              <h2 className="font-manrope text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                Local farms. <span className="text-primary block sm:inline">Connecticut & Hudson Valley sourced.</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                We partner with family farms across Connecticut and the Hudson Valley that share our commitment to
                quality and transparency. Supporting local agriculture while providing the freshest ingredients.
              </p>
            </div>

            <div className="space-y-3 md:space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <MapPin className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm md:text-base">Local Farm Network</div>
                  <div className="text-xs md:text-sm text-muted-foreground">Within 150 miles of our kitchen</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <Award className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm md:text-base">Regional Quality Standards</div>
                  <div className="text-xs md:text-sm text-muted-foreground">
                    Connecticut Department of Agriculture certified
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
                <div
                  ref={mapRef}
                  className="w-full h-64 sm:h-80 md:h-96 lg:min-h-[400px]"
                  style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #fef3c7 100%)" }}
                >
                  <div className="flex items-center justify-center h-full text-muted-foreground p-4">
                    {mapError ? (
                      <div className="text-center">
                        <p className="text-red-500 mb-2 text-sm md:text-base">Map unavailable</p>
                        <p className="text-xs md:text-sm">Showing our Connecticut & Hudson Valley farm network</p>
                      </div>
                    ) : mapLoaded ? null : (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-sm md:text-base">Loading interactive farm map...</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="absolute -bottom-2 -left-2 md:-bottom-4 md:-left-4 bg-card border rounded-lg md:rounded-xl p-3 md:p-4 shadow-lg max-w-[180px] md:max-w-none">
              <div className="text-xs md:text-sm font-medium">Batch #CT-2024-001</div>
              <div className="text-xs text-muted-foreground">Connecticut sourced</div>
              <Badge variant="outline" className="mt-1 md:mt-2 text-xs">
                View Local COA
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
