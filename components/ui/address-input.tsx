"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"

interface AddressInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  required?: boolean
  id?: string
}

declare global {
  interface Window {
    google: any
    initGooglePlaces: () => void
    gm_authFailure: () => void
  }
}

export function AddressInput({ value, onChange, placeholder, className, required, id }: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const autocompleteService = useRef<any>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const loadGooglePlaces = () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

      console.log("[v0] Google Maps API Key available:", !!apiKey)
      console.log("[v0] API Key value:", apiKey ? `${apiKey.substring(0, 20)}...` : "undefined")
      console.log("[v0] Expected new API key starts with:", "AIzaSyDBw5saJyqC6dmeDU9EjJ5hKscuguhtTSw".substring(0, 20))
      console.log("[v0] API Key matches expected:", apiKey === "AIzaSyDBw5saJyqC6dmeDU9EjJ5hKscuguhtTSw")

      if (!apiKey) {
        setError("Google Maps API key not found")
        console.error("[v0] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable is not set")
        return
      }

      window.gm_authFailure = () => {
        console.error("[v0] Google Maps authentication failed for Places API")
        setError("Google Maps authentication failed - check API key")
      }

      if (window.google && window.google.maps && window.google.maps.places) {
        console.log("[v0] Google Maps API already loaded")
        try {
          console.log("[v0] Attempting to create AutocompleteService...")
          autocompleteService.current = new window.google.maps.places.AutocompleteService()
          console.log("[v0] AutocompleteService created successfully:", !!autocompleteService.current)
          setIsGoogleLoaded(true)
          setError(null)
        } catch (error) {
          console.error("[v0] Error creating AutocompleteService:", error)
          setError("Failed to initialize Google Places service")
        }
        return
      }

      if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
        console.log("[v0] Loading Google Maps API with Places library using new API key")
        const script = document.createElement("script")
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`
        script.async = true
        script.defer = true

        script.onerror = () => {
          console.error("[v0] Failed to load Google Maps API - check API key validity")
          setError("Failed to load Google Maps API")
        }

        window.initGooglePlaces = () => {
          console.log("[v0] Google Places API initialized successfully with new key")
          if (window.google && window.google.maps && window.google.maps.places) {
            try {
              console.log("[v0] Attempting to create AutocompleteService in callback...")
              autocompleteService.current = new window.google.maps.places.AutocompleteService()
              console.log("[v0] AutocompleteService created successfully in callback:", !!autocompleteService.current)
              setIsGoogleLoaded(true)
              setError(null)
            } catch (error) {
              console.error("[v0] Error creating AutocompleteService in callback:", error)
              setError("Failed to initialize Google Places service")
            }
          } else {
            console.error("[v0] Google Places API not available after initialization")
            setError("Google Places API not available")
          }
        }

        document.head.appendChild(script)
      }
    }

    loadGooglePlaces()
  }, [])

  const fetchAddressSuggestions = async (query: string) => {
    console.log("[v0] fetchAddressSuggestions called with query:", query)
    console.log("[v0] Query length:", query.length)
    console.log("[v0] isGoogleLoaded:", isGoogleLoaded)
    console.log("[v0] autocompleteService available:", !!autocompleteService.current)

    if (query.length < 3) {
      console.log("[v0] Query too short, clearing suggestions")
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    if (!isGoogleLoaded) {
      console.log("[v0] Google not loaded yet")
      return
    }

    if (!autocompleteService.current) {
      console.log("[v0] AutocompleteService not available")
      return
    }

    console.log("[v0] Starting address suggestions fetch...")
    setIsLoading(true)
    try {
      autocompleteService.current.getPlacePredictions(
        {
          input: query,
          types: ["address"],
          componentRestrictions: { country: "us" },
        },
        (predictions: any[], status: any) => {
          console.log("[v0] Places API response status:", status)
          console.log("[v0] Predictions received:", predictions)
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            const suggestionList = predictions.map((prediction) => prediction.description)
            console.log("[v0] Suggestion list:", suggestionList)
            setSuggestions(suggestionList)
            setShowSuggestions(true)
            console.log("[v0] Found", suggestionList.length, "address suggestions")
          } else {
            console.log("[v0] No predictions or error status:", status)
            if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
              console.error("[v0] Places API error status:", status)
              if (status === window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
                setError("API request denied - check API key permissions")
              } else if (status === window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
                setError("API quota exceeded")
              }
            }
            setSuggestions([])
            setShowSuggestions(false)
          }
          setIsLoading(false)
        },
      )
    } catch (error) {
      console.error("[v0] Error fetching address suggestions:", error)
      setError("Error fetching address suggestions")
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    console.log("[v0] Input changed to:", newValue)
    onChange(newValue)

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      console.log("[v0] Debounce timeout triggered, calling fetchAddressSuggestions")
      fetchAddressSuggestions(newValue)
    }, 300)
  }

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setShowSuggestions(false)
    setSuggestions([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        suggestionsRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        required={required}
        autoComplete="street-address"
      />

      {error && (
        <div className="absolute z-50 w-full mt-1 bg-red-50 border border-red-200 rounded-md p-2">
          <p className="text-sm text-red-600">{error}</p>
          <p className="text-xs text-red-500 mt-1">
            {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
              ? "API key not configured in environment variables"
              : "Check browser console for more details"}
          </p>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
        </div>
      )}
    </div>
  )
}
