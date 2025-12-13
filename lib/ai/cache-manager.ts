/**
 * 3-Layer Caching Strategy for AI LLM Responses
 *
 * Layer 1: Session Cache (in-memory) - Current session only
 * Layer 2: User Cache (localStorage) - 7 days TTL
 * Layer 3: Global Cache (Supabase) - Frequent profiles (future implementation)
 *
 * Target: 70%+ cache hit rate to reduce costs
 */

import type { MultiDogProfile } from "@/lib/multi-dog-types"

const CACHE_VERSION = "v1"
const CACHE_TTL_DAYS = 7
const SESSION_CACHE = new Map<string, CachedResponse>()

interface CachedResponse {
  explanation: string
  timestamp: number
  cacheKey: string
  tokensUsed?: number
}

interface CacheStats {
  hits: number
  misses: number
  hitRate: number
}

// Track cache performance
const stats: CacheStats = {
  hits: 0,
  misses: 0,
  hitRate: 0,
}

/**
 * Generate a deterministic cache key from dog profile
 * Rounds weight to nearest 5 to increase cache hits for similar profiles
 */
export function generateCacheKey(
  dogProfile: Partial<MultiDogProfile>,
  explanationType: string
): string {
  const {
    age,
    ageUnit,
    weight,
    weightUnit,
    activity,
    bodyCondition,
    healthGoals,
    allergens,
  } = dogProfile

  // Round weight to nearest 5 for better cache hits
  const roundedWeight = weight ? Math.round(weight / 5) * 5 : 0

  // Create a normalized representation
  const keyParts = [
    CACHE_VERSION,
    explanationType,
    `age:${age}${ageUnit}`,
    `weight:${roundedWeight}${weightUnit}`,
    `activity:${activity || "unknown"}`,
    `body:${bodyCondition || "unknown"}`,
    `goal:${healthGoals?.weightGoal || "none"}`,
    `allergens:${allergens?.sort().join(",") || "none"}`,
  ]

  // Simple hash function (for browser compatibility)
  const keyString = keyParts.join("|")
  return btoa(keyString).substring(0, 32)
}

/**
 * Layer 1: Check session cache (in-memory)
 */
function getFromSessionCache(cacheKey: string): CachedResponse | null {
  return SESSION_CACHE.get(cacheKey) || null
}

/**
 * Layer 1: Save to session cache
 */
function saveToSessionCache(cacheKey: string, response: CachedResponse): void {
  SESSION_CACHE.set(cacheKey, response)
}

/**
 * Layer 2: Check localStorage cache
 */
function getFromLocalStorage(cacheKey: string): CachedResponse | null {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem(`ai-cache:${cacheKey}`)
    if (!stored) return null

    const cached: CachedResponse = JSON.parse(stored)

    // Check if expired (7 days)
    const age = Date.now() - cached.timestamp
    const maxAge = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000

    if (age > maxAge) {
      localStorage.removeItem(`ai-cache:${cacheKey}`)
      return null
    }

    return cached
  } catch (error) {
    console.error("[Cache] localStorage read error:", error)
    return null
  }
}

/**
 * Layer 2: Save to localStorage cache
 */
function saveToLocalStorage(cacheKey: string, response: CachedResponse): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(`ai-cache:${cacheKey}`, JSON.stringify(response))
  } catch (error) {
    console.error("[Cache] localStorage write error:", error)
    // Silently fail - cache is optional
  }
}

/**
 * Get cached explanation (checks all layers)
 * Returns null if not found or expired
 */
export function getCachedExplanation(cacheKey: string): string | null {
  // Layer 1: Session cache (fastest)
  const sessionCached = getFromSessionCache(cacheKey)
  if (sessionCached) {
    stats.hits++
    updateHitRate()

    // Track cache hit analytics (client-side only)
    if (typeof window !== "undefined") {
      import("@/lib/analytics/ai-events").then(({ trackCacheHit }) => {
        trackCacheHit({ cacheKey, cacheLayer: "session" })
      })
    }

    return sessionCached.explanation
  }

  // Layer 2: localStorage (fast)
  const localCached = getFromLocalStorage(cacheKey)
  if (localCached) {
    // Promote to session cache
    saveToSessionCache(cacheKey, localCached)
    stats.hits++
    updateHitRate()

    // Track cache hit analytics
    if (typeof window !== "undefined") {
      import("@/lib/analytics/ai-events").then(({ trackCacheHit }) => {
        trackCacheHit({ cacheKey, cacheLayer: "localStorage" })
      })
    }

    return localCached.explanation
  }

  // Layer 3: Global cache (Supabase) - future implementation
  // TODO: Check Supabase cache for frequently requested profiles

  stats.misses++
  updateHitRate()

  // Track cache miss
  if (typeof window !== "undefined") {
    import("@/lib/analytics/ai-events").then(({ trackCacheMiss }) => {
      trackCacheMiss({ cacheKey })
    })
  }

  return null
}

/**
 * Save explanation to all cache layers
 */
export function cacheExplanation(
  cacheKey: string,
  explanation: string,
  tokensUsed?: number
): void {
  const response: CachedResponse = {
    explanation,
    timestamp: Date.now(),
    cacheKey,
    tokensUsed,
  }

  // Save to all layers
  saveToSessionCache(cacheKey, response)
  saveToLocalStorage(cacheKey, response)

  // Layer 3: Save to global cache if frequently requested
  // TODO: Implement Supabase caching for popular profiles
}

/**
 * Clear all caches (useful for debugging)
 */
export function clearAllCaches(): void {
  SESSION_CACHE.clear()

  if (typeof window !== "undefined") {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith("ai-cache:")) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error("[Cache] Clear error:", error)
    }
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  return { ...stats }
}

/**
 * Update hit rate percentage
 */
function updateHitRate(): void {
  const total = stats.hits + stats.misses
  stats.hitRate = total > 0 ? (stats.hits / total) * 100 : 0
}

/**
 * Clear expired entries from localStorage
 * Call this periodically to prevent localStorage bloat
 */
export function cleanupExpiredCache(): void {
  if (typeof window === "undefined") return

  try {
    const keys = Object.keys(localStorage)
    const now = Date.now()
    const maxAge = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000
    let removed = 0

    keys.forEach((key) => {
      if (key.startsWith("ai-cache:")) {
        try {
          const stored = localStorage.getItem(key)
          if (stored) {
            const cached: CachedResponse = JSON.parse(stored)
            if (now - cached.timestamp > maxAge) {
              localStorage.removeItem(key)
              removed++
            }
          }
        } catch (error) {
          // Invalid entry, remove it
          localStorage.removeItem(key)
          removed++
        }
      }
    })

    if (removed > 0) {
      console.log(`[Cache] Cleaned up ${removed} expired entries`)
    }
  } catch (error) {
    console.error("[Cache] Cleanup error:", error)
  }
}
