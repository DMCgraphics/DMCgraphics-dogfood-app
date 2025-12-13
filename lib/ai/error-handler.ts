/**
 * Centralized error handling for AI features
 * Provides graceful degradation and user-friendly error messages
 */

export type AIErrorType =
  | "api_key_missing"
  | "api_key_invalid"
  | "rate_limit"
  | "network_error"
  | "timeout"
  | "invalid_response"
  | "unknown"

export interface AIError {
  type: AIErrorType
  message: string
  userMessage: string
  shouldRetry: boolean
  fallbackAvailable: boolean
}

/**
 * Parse error from Anthropic API or network errors
 */
export function parseAIError(error: unknown): AIError {
  // API key errors
  if (error instanceof Error && error.message.includes("api_key")) {
    return {
      type: "api_key_invalid",
      message: error.message,
      userMessage: "We're having trouble connecting to our AI service. Don't worry - we'll use our standard recommendations instead!",
      shouldRetry: false,
      fallbackAvailable: true,
    }
  }

  // Rate limit errors
  if (error instanceof Error && (error.message.includes("rate_limit") || error.message.includes("429"))) {
    return {
      type: "rate_limit",
      message: error.message,
      userMessage: "Our AI is getting a lot of requests right now! We'll show you our standard recommendations.",
      shouldRetry: true,
      fallbackAvailable: true,
    }
  }

  // Timeout errors
  if (error instanceof Error && (error.message.includes("timeout") || error.message.includes("ETIMEDOUT"))) {
    return {
      type: "timeout",
      message: error.message,
      userMessage: "The AI is taking longer than expected. We'll use our standard recommendations instead.",
      shouldRetry: true,
      fallbackAvailable: true,
    }
  }

  // Network errors
  if (error instanceof Error && (error.message.includes("network") || error.message.includes("fetch"))) {
    return {
      type: "network_error",
      message: error.message,
      userMessage: "We couldn't connect to our AI service. Don't worry - our standard recommendations are ready!",
      shouldRetry: true,
      fallbackAvailable: true,
    }
  }

  // Invalid response
  if (error instanceof Error && error.message.includes("invalid")) {
    return {
      type: "invalid_response",
      message: error.message,
      userMessage: "We received an unexpected response. Using our standard recommendations instead.",
      shouldRetry: false,
      fallbackAvailable: true,
    }
  }

  // Unknown errors
  return {
    type: "unknown",
    message: error instanceof Error ? error.message : "Unknown error",
    userMessage: "Something went wrong with our AI. We'll show you our standard recommendations!",
    shouldRetry: false,
    fallbackAvailable: true,
  }
}

/**
 * Log AI errors for monitoring (without exposing sensitive info)
 */
export function logAIError(error: AIError, context?: Record<string, any>) {
  const logData = {
    timestamp: new Date().toISOString(),
    type: error.type,
    message: error.message,
    shouldRetry: error.shouldRetry,
    context: context || {},
  }

  // In development, log to console
  if (process.env.NODE_ENV === "development") {
    console.error("[AI Error]", logData)
  }

  // In production, send to analytics/monitoring service
  // TODO: Send to your monitoring service (e.g., Sentry, LogRocket)
  if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    // Example: window.analytics?.track('AI Error', logData)
  }
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      const aiError = parseAIError(error)

      // Don't retry if error is not retryable
      if (!aiError.shouldRetry) {
        throw error
      }

      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        throw error
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise((resolve) => setTimeout(resolve, delay))

      console.log(`[AI] Retrying after ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
    }
  }

  throw lastError
}

/**
 * Health check for AI service
 */
export async function checkAIHealth(): Promise<{
  llmEnabled: boolean
  apiKeyValid: boolean
  lastError?: string
}> {
  try {
    // Simple check: verify env vars are set
    const llmEnabled = process.env.ENABLE_AI_LLM === "true"
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "your_anthropic_api_key_here"

    return {
      llmEnabled,
      apiKeyValid: hasApiKey,
    }
  } catch (error) {
    return {
      llmEnabled: false,
      apiKeyValid: false,
      lastError: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
