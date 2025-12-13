"use client"

import { useEffect } from "react"
import { cleanupExpiredCache } from "./cache-manager"

/**
 * Hook to clean up expired AI cache entries on app mount
 * Call this once in your root layout or app component
 */
export function useCacheCleanup() {
  useEffect(() => {
    // Run cleanup on mount
    cleanupExpiredCache()

    // Optional: Run cleanup periodically (every hour)
    const interval = setInterval(() => {
      cleanupExpiredCache()
    }, 60 * 60 * 1000) // 1 hour

    return () => clearInterval(interval)
  }, [])
}
