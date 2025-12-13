/**
 * Cost tracking for AI LLM usage
 * Monitors token usage and estimates costs
 */

// Claude 3 Haiku pricing (as of Dec 2024)
const HAIKU_INPUT_PRICE_PER_1M = 0.25 // $0.25 per 1M input tokens
const HAIKU_OUTPUT_PRICE_PER_1M = 1.25 // $1.25 per 1M output tokens

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCost: number
  timestamp: number
  feature: string
}

export interface CostSummary {
  totalCost: number
  totalTokens: number
  totalRequests: number
  averageCostPerRequest: number
  costByFeature: Record<string, number>
}

/**
 * Calculate cost for token usage
 */
export function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * HAIKU_INPUT_PRICE_PER_1M
  const outputCost = (outputTokens / 1_000_000) * HAIKU_OUTPUT_PRICE_PER_1M
  return inputCost + outputCost
}

/**
 * Track token usage (client-side)
 */
export function trackTokenUsage(
  inputTokens: number,
  outputTokens: number,
  feature: string = "unknown"
): TokenUsage {
  const usage: TokenUsage = {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    estimatedCost: calculateCost(inputTokens, outputTokens),
    timestamp: Date.now(),
    feature,
  }

  // Store in localStorage for tracking
  if (typeof window !== "undefined") {
    try {
      const key = `ai-cost-${Date.now()}`
      localStorage.setItem(key, JSON.stringify(usage))

      // Keep only last 100 entries
      cleanupOldCostEntries()
    } catch (error) {
      // Silently fail
    }
  }

  // Log in development
  if (process.env.NODE_ENV === "development") {
    console.log("[Cost Tracker]", {
      feature,
      tokens: usage.totalTokens,
      cost: `$${usage.estimatedCost.toFixed(6)}`,
    })
  }

  return usage
}

/**
 * Get cost summary from localStorage
 */
export function getCostSummary(days: number = 7): CostSummary {
  if (typeof window === "undefined") {
    return {
      totalCost: 0,
      totalTokens: 0,
      totalRequests: 0,
      averageCostPerRequest: 0,
      costByFeature: {},
    }
  }

  try {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    const keys = Object.keys(localStorage)
    const usages: TokenUsage[] = []

    keys.forEach((key) => {
      if (key.startsWith("ai-cost-")) {
        try {
          const usage: TokenUsage = JSON.parse(localStorage.getItem(key) || "{}")
          if (usage.timestamp >= cutoff) {
            usages.push(usage)
          }
        } catch (error) {
          // Skip invalid entries
        }
      }
    })

    const totalCost = usages.reduce((sum, u) => sum + u.estimatedCost, 0)
    const totalTokens = usages.reduce((sum, u) => sum + u.totalTokens, 0)
    const totalRequests = usages.length

    const costByFeature: Record<string, number> = {}
    usages.forEach((u) => {
      costByFeature[u.feature] = (costByFeature[u.feature] || 0) + u.estimatedCost
    })

    return {
      totalCost,
      totalTokens,
      totalRequests,
      averageCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      costByFeature,
    }
  } catch (error) {
    return {
      totalCost: 0,
      totalTokens: 0,
      totalRequests: 0,
      averageCostPerRequest: 0,
      costByFeature: {},
    }
  }
}

/**
 * Clean up old cost tracking entries
 */
function cleanupOldCostEntries() {
  if (typeof window === "undefined") return

  try {
    const keys = Object.keys(localStorage)
    const costKeys = keys.filter((k) => k.startsWith("ai-cost-"))

    // Keep only the most recent 100 entries
    if (costKeys.length > 100) {
      const sortedKeys = costKeys
        .map((key) => {
          try {
            const usage: TokenUsage = JSON.parse(localStorage.getItem(key) || "{}")
            return { key, timestamp: usage.timestamp || 0 }
          } catch (error) {
            return { key, timestamp: 0 }
          }
        })
        .sort((a, b) => b.timestamp - a.timestamp)

      // Remove oldest entries
      sortedKeys.slice(100).forEach(({ key }) => {
        localStorage.removeItem(key)
      })
    }
  } catch (error) {
    // Silently fail
  }
}

/**
 * Export cost data (for reporting)
 */
export function exportCostData(): string {
  const summary = getCostSummary(30) // Last 30 days
  return JSON.stringify(summary, null, 2)
}

/**
 * Get daily cost estimate based on current usage
 */
export function getDailyCostEstimate(): number {
  const summary = getCostSummary(1) // Last 24 hours
  return summary.totalCost
}

/**
 * Get monthly cost projection
 */
export function getMonthlyCostProjection(): number {
  const dailyCost = getDailyCostEstimate()
  return dailyCost * 30
}
