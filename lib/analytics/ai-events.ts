/**
 * Analytics tracking for AI features
 * Tracks user interactions, performance, and costs
 */

export interface AIEventData {
  // Event metadata
  timestamp: number
  sessionId?: string
  userId?: string

  // Event-specific data
  [key: string]: any
}

export type AIEventType =
  | "ai_recommendation_viewed"
  | "ai_recommendation_clicked"
  | "ai_explanation_generated"
  | "ai_chat_opened"
  | "ai_chat_message_sent"
  | "ai_confidence_details_viewed"
  | "ai_what_if_used"
  | "ai_inline_tip_viewed"
  | "ai_inline_tip_dismissed"
  | "ai_alternative_viewed"
  | "ai_cache_hit"
  | "ai_cache_miss"
  | "ai_error"
  | "ai_fallback_used"

/**
 * Track AI event
 */
export function trackAIEvent(eventType: AIEventType, data?: Partial<AIEventData>) {
  const eventData: AIEventData = {
    timestamp: Date.now(),
    sessionId: getSessionId(),
    ...data,
  }

  // Log in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[AI Analytics] ${eventType}`, eventData)
  }

  // Send to analytics service in production
  if (typeof window !== "undefined") {
    // Google Analytics 4
    if ((window as any).gtag) {
      ;(window as any).gtag("event", eventType, eventData)
    }

    // PostHog
    if ((window as any).posthog) {
      ;(window as any).posthog.capture(eventType, eventData)
    }

    // Custom analytics endpoint
    sendToAnalyticsAPI(eventType, eventData)
  }
}

/**
 * Send analytics to custom backend
 */
async function sendToAnalyticsAPI(eventType: AIEventType, data: AIEventData) {
  try {
    // Only send in production
    if (process.env.NODE_ENV !== "production") return

    await fetch("/api/analytics/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: eventType,
        data,
      }),
    }).catch(() => {
      // Silently fail - don't block user experience
    })
  } catch (error) {
    // Silently fail
  }
}

/**
 * Get or create session ID
 */
function getSessionId(): string {
  if (typeof window === "undefined") return "server"

  let sessionId = sessionStorage.getItem("ai_session_id")
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    sessionStorage.setItem("ai_session_id", sessionId)
  }
  return sessionId
}

/**
 * Track AI recommendation view
 */
export function trackRecommendationViewed(data: {
  dogName: string
  confidence: number
  topRecipe: string
  cached?: boolean
}) {
  trackAIEvent("ai_recommendation_viewed", data)
}

/**
 * Track AI explanation generation
 */
export function trackExplanationGenerated(data: {
  explanationType: string
  cached: boolean
  tokensUsed?: number
  responseTime?: number
  llmUsed?: boolean
}) {
  trackAIEvent("ai_explanation_generated", data)
}

/**
 * Track AI chat interaction
 */
export function trackChatMessageSent(data: {
  dogName: string
  messageLength: number
  responseTime?: number
  cached?: boolean
}) {
  trackAIEvent("ai_chat_message_sent", data)
}

/**
 * Track cache performance
 */
export function trackCacheHit(data: {
  cacheKey: string
  cacheLayer: "session" | "localStorage" | "supabase"
}) {
  trackAIEvent("ai_cache_hit", data)
}

export function trackCacheMiss(data: {
  cacheKey: string
}) {
  trackAIEvent("ai_cache_miss", data)
}

/**
 * Track AI errors
 */
export function trackAIError(data: {
  errorType: string
  errorMessage: string
  context?: Record<string, any>
}) {
  trackAIEvent("ai_error", data)
}

/**
 * Track fallback usage
 */
export function trackFallbackUsed(data: {
  reason: string
  feature: string
}) {
  trackAIEvent("ai_fallback_used", data)
}

/**
 * Track What-If simulator usage
 */
export function trackWhatIfUsed(data: {
  dogName: string
  simulationType: string
  originalRecipe: string
  newRecipe: string
}) {
  trackAIEvent("ai_what_if_used", data)
}

/**
 * Get AI analytics summary
 */
export function getAIAnalyticsSummary(): {
  totalEvents: number
  eventBreakdown: Record<string, number>
} {
  // This would typically query your analytics backend
  // For now, return placeholder data
  return {
    totalEvents: 0,
    eventBreakdown: {},
  }
}
