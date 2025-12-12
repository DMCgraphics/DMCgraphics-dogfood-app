/**
 * LLM Service - Anthropic Claude Integration
 *
 * Handles:
 * - API client setup
 * - Request batching
 * - Caching (session, user, global)
 * - Rate limiting (10 requests/minute)
 * - Fallback to templates on failure
 */

import Anthropic from '@anthropic-ai/sdk'
import type { MessageCreateParams } from '@anthropic-ai/sdk/resources/messages'
import { TEMPLATE_FALLBACKS } from './prompt-templates'

// Environment configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''
const ENABLE_LLM = process.env.NEXT_PUBLIC_ENABLE_AI_LLM === 'true'
const ENABLE_BATCHING = process.env.AI_ENABLE_BATCHING !== 'false'
const FALLBACK_TO_TEMPLATES = process.env.AI_FALLBACK_TO_TEMPLATES !== 'false'
const RATE_LIMIT_PER_MINUTE = parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE || '10', 10)

// Initialize Anthropic client
let anthropic: Anthropic | null = null
if (ENABLE_LLM && ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
  })
}

// Session cache (in-memory) - cleared on page reload
const sessionCache = new Map<string, CachedResponse>()

interface CachedResponse {
  response: string
  timestamp: number
  tokensUsed: number
}

interface LLMRequest {
  id: string
  prompt: string
  maxTokens?: number
}

interface LLMResponse {
  id: string
  text: string
  cached: boolean
  tokensUsed: number
  error?: string
}

// Rate limiting
let requestCount = 0
let lastResetTime = Date.now()

function checkRateLimit(): boolean {
  const now = Date.now()
  const elapsed = now - lastResetTime

  // Reset counter every minute
  if (elapsed >= 60000) {
    requestCount = 0
    lastResetTime = now
  }

  if (requestCount >= RATE_LIMIT_PER_MINUTE) {
    console.warn('[LLM Service] Rate limit reached:', requestCount, 'requests/minute')
    return false
  }

  requestCount++
  return true
}

/**
 * Generate cache key from prompt
 */
function generateCacheKey(prompt: string): string {
  // Simple hash function for cache key
  let hash = 0
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(36)
}

/**
 * Get cached response if available and fresh
 */
function getCachedResponse(cacheKey: string): string | null {
  const cached = sessionCache.get(cacheKey)
  if (!cached) return null

  // Check if cache is still fresh (7 days)
  const age = Date.now() - cached.timestamp
  const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

  if (age > maxAge) {
    sessionCache.delete(cacheKey)
    return null
  }

  console.log('[LLM Service] Cache hit:', cacheKey)
  return cached.response
}

/**
 * Store response in cache
 */
function setCachedResponse(cacheKey: string, response: string, tokensUsed: number): void {
  sessionCache.set(cacheKey, {
    response,
    timestamp: Date.now(),
    tokensUsed,
  })
}

/**
 * Generate LLM response with caching and rate limiting
 */
export async function generateLLMResponse(
  prompt: string,
  options: {
    maxTokens?: number
    temperature?: number
    useCache?: boolean
  } = {}
): Promise<LLMResponse> {
  const { maxTokens = 300, temperature = 0.7, useCache = true } = options

  // Check cache first
  if (useCache) {
    const cacheKey = generateCacheKey(prompt)
    const cached = getCachedResponse(cacheKey)
    if (cached) {
      return {
        id: cacheKey,
        text: cached,
        cached: true,
        tokensUsed: 0,
      }
    }
  }

  // Check if LLM is enabled
  if (!ENABLE_LLM || !anthropic) {
    console.warn('[LLM Service] LLM disabled or API key not configured, using fallback')
    return {
      id: 'fallback',
      text: 'LLM not available',
      cached: false,
      tokensUsed: 0,
      error: 'LLM not configured',
    }
  }

  // Check rate limit
  if (!checkRateLimit()) {
    console.warn('[LLM Service] Rate limit exceeded, using fallback')
    return {
      id: 'rate-limited',
      text: 'Rate limit exceeded',
      cached: false,
      tokensUsed: 0,
      error: 'Rate limit exceeded',
    }
  }

  try {
    const startTime = Date.now()

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const duration = Date.now() - startTime
    console.log('[LLM Service] Request completed in', duration, 'ms')

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const tokensUsed = message.usage.input_tokens + message.usage.output_tokens

    // Cache the response
    if (useCache) {
      const cacheKey = generateCacheKey(prompt)
      setCachedResponse(cacheKey, text, tokensUsed)
    }

    return {
      id: message.id,
      text,
      cached: false,
      tokensUsed,
    }
  } catch (error) {
    console.error('[LLM Service] Error generating response:', error)

    if (FALLBACK_TO_TEMPLATES) {
      console.log('[LLM Service] Using template fallback')
      return {
        id: 'error-fallback',
        text: 'Error occurred, using fallback',
        cached: false,
        tokensUsed: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    throw error
  }
}

/**
 * Batch generate LLM responses
 */
export async function batchGenerateLLMResponses(
  requests: LLMRequest[]
): Promise<LLMResponse[]> {
  if (!ENABLE_BATCHING) {
    // Process sequentially if batching disabled
    const responses: LLMResponse[] = []
    for (const request of requests) {
      const response = await generateLLMResponse(request.prompt, {
        maxTokens: request.maxTokens,
      })
      responses.push({
        ...response,
        id: request.id,
      })
    }
    return responses
  }

  // Process in parallel with Promise.all
  try {
    const responsePromises = requests.map(async (request) => {
      const response = await generateLLMResponse(request.prompt, {
        maxTokens: request.maxTokens,
      })
      return {
        ...response,
        id: request.id,
      }
    })

    return await Promise.all(responsePromises)
  } catch (error) {
    console.error('[LLM Service] Batch request error:', error)
    throw error
  }
}

/**
 * Get confidence explanation with LLM or fallback
 */
export async function getConfidenceExplanation(
  confidence: number,
  dogName: string,
  topFactors: Array<{ factor: string; points: number; description: string }>,
  missingData: string[]
): Promise<string> {
  // Try LLM first
  if (ENABLE_LLM && anthropic) {
    try {
      const prompt = `Generate a warm, conversational 2-3 sentence explanation for why we have ${confidence}% confidence in our meal recommendation for ${dogName}.

Top factors: ${topFactors.map((f) => `${f.factor} (+${f.points} points)`).join(', ')}
Missing data: ${missingData.length > 0 ? missingData.join(', ') : 'None'}

Keep it friendly, use ${dogName}'s name, and use ONE emoji maximum.`

      const response = await generateLLMResponse(prompt, { maxTokens: 150 })

      if (response.error && FALLBACK_TO_TEMPLATES) {
        return TEMPLATE_FALLBACKS.confidenceExplanation(confidence, dogName)
      }

      return response.text
    } catch (error) {
      console.error('[LLM Service] Error in confidence explanation:', error)
      if (FALLBACK_TO_TEMPLATES) {
        return TEMPLATE_FALLBACKS.confidenceExplanation(confidence, dogName)
      }
      throw error
    }
  }

  // Fallback to template
  return TEMPLATE_FALLBACKS.confidenceExplanation(confidence, dogName)
}

/**
 * Get step guidance with LLM or fallback
 */
export async function getStepGuidance(step: number, dogName: string): Promise<string> {
  // Try LLM first
  if (ENABLE_LLM && anthropic) {
    try {
      const stepNames: Record<number, string> = {
        1: 'Basic Profile',
        2: 'Health Goals',
        3: 'Allergens & Preferences',
        4: 'Recipe Selection',
        5: 'Portion Planning',
        6: 'Review & Customize',
      }

      const prompt = `Generate a warm, encouraging 1-2 sentence message for ${dogName}'s owner as they move to Step ${step}: ${stepNames[step]}.

Keep it brief, use ${dogName}'s name, and use ONE emoji maximum.`

      const response = await generateLLMResponse(prompt, { maxTokens: 100 })

      if (response.error && FALLBACK_TO_TEMPLATES) {
        return TEMPLATE_FALLBACKS.stepGuidance(step, dogName)
      }

      return response.text
    } catch (error) {
      console.error('[LLM Service] Error in step guidance:', error)
      if (FALLBACK_TO_TEMPLATES) {
        return TEMPLATE_FALLBACKS.stepGuidance(step, dogName)
      }
      throw error
    }
  }

  // Fallback to template
  return TEMPLATE_FALLBACKS.stepGuidance(step, dogName)
}

/**
 * Get weight goal validation with LLM or fallback
 */
export async function getWeightGoalValidation(
  dogName: string,
  currentWeight: number,
  targetWeight: number,
  weightUnit: string,
  goal: 'lose' | 'gain' | 'maintain'
): Promise<string> {
  const percentChange = (Math.abs(currentWeight - targetWeight) / currentWeight) * 100

  // Try LLM first
  if (ENABLE_LLM && anthropic) {
    try {
      const prompt = `Validate ${dogName}'s weight ${goal} goal: ${currentWeight} → ${targetWeight} ${weightUnit} (${percentChange.toFixed(1)}% change).

Generate 2-3 sentences that validate if healthy, provide timeline, and encourage. Use ${dogName}'s name and ONE emoji max.`

      const response = await generateLLMResponse(prompt, { maxTokens: 150 })

      if (response.error && FALLBACK_TO_TEMPLATES) {
        return TEMPLATE_FALLBACKS.weightGoalValidation(percentChange, dogName, goal)
      }

      return response.text
    } catch (error) {
      console.error('[LLM Service] Error in weight goal validation:', error)
      if (FALLBACK_TO_TEMPLATES) {
        return TEMPLATE_FALLBACKS.weightGoalValidation(percentChange, dogName, goal)
      }
      throw error
    }
  }

  // Fallback to template
  return TEMPLATE_FALLBACKS.weightGoalValidation(percentChange, dogName, goal)
}

/**
 * Get allergen impact explanation with LLM or fallback
 */
export async function getAllergenImpactExplanation(
  dogName: string,
  availableRecipes: number
): Promise<string> {
  // Try LLM first
  if (ENABLE_LLM && anthropic) {
    try {
      const prompt = `${dogName} has allergen restrictions. After filtering, ${availableRecipes} recipes remain.

Generate a reassuring 2 sentence message. Use ${dogName}'s name and ONE emoji max.`

      const response = await generateLLMResponse(prompt, { maxTokens: 100 })

      if (response.error && FALLBACK_TO_TEMPLATES) {
        return TEMPLATE_FALLBACKS.allergenImpact(availableRecipes, dogName)
      }

      return response.text
    } catch (error) {
      console.error('[LLM Service] Error in allergen impact:', error)
      if (FALLBACK_TO_TEMPLATES) {
        return TEMPLATE_FALLBACKS.allergenImpact(availableRecipes, dogName)
      }
      throw error
    }
  }

  // Fallback to template
  return TEMPLATE_FALLBACKS.allergenImpact(availableRecipes, dogName)
}

/**
 * Clear session cache (useful for testing or on logout)
 */
export function clearSessionCache(): void {
  sessionCache.clear()
  console.log('[LLM Service] Session cache cleared')
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number
  entries: Array<{ key: string; age: number; tokensUsed: number }>
} {
  const entries = Array.from(sessionCache.entries()).map(([key, value]) => ({
    key,
    age: Date.now() - value.timestamp,
    tokensUsed: value.tokensUsed,
  }))

  return {
    size: sessionCache.size,
    entries,
  }
}
