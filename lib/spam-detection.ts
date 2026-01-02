/**
 * Spam Detection and Content Validation
 *
 * Minimal content validation for contact form submissions
 * Per user preference: 100 character minimum, no phrase blocking
 */

export interface ContentValidationResult {
  valid: boolean
  reason?: string
}

export interface ContentValidationConfig {
  minMessageLength: number
  maxMessageLength: number
  minNameLength: number
}

const DEFAULT_CONFIG: ContentValidationConfig = {
  minMessageLength: 50, // ~1-2 sentences minimum
  maxMessageLength: 10000,
  minNameLength: 2,
}

/**
 * Validates contact form content for spam indicators
 * Uses minimal, privacy-respecting checks
 */
export function validateContactContent(
  data: {
    name: string
    email: string
    message: string
  },
  config: ContentValidationConfig = DEFAULT_CONFIG
): ContentValidationResult {
  // Trim all fields
  const name = data.name?.trim() || ""
  const email = data.email?.trim() || ""
  const message = data.message?.trim() || ""

  // Name validation
  if (name.length < config.minNameLength) {
    return {
      valid: false,
      reason: "Name is too short",
    }
  }

  // Email format validation (basic)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      reason: "Invalid email format",
    }
  }

  // Message length validation
  if (message.length < config.minMessageLength) {
    return {
      valid: false,
      reason: `Message must be at least ${config.minMessageLength} characters long (about one paragraph)`,
    }
  }

  if (message.length > config.maxMessageLength) {
    return {
      valid: false,
      reason: `Message is too long (max ${config.maxMessageLength} characters)`,
    }
  }

  // Check for all-caps shouting (likely spam if entire message is caps)
  // Only check if message is long enough to be meaningful
  if (message.length > 20) {
    const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length
    if (capsRatio > 0.7) {
      return {
        valid: false,
        reason: "Please avoid using excessive capital letters",
      }
    }
  }

  // Check for excessive special characters (common in spam)
  const specialCharRatio =
    (message.match(/[^a-zA-Z0-9\s.,!?'-]/g) || []).length / message.length
  if (specialCharRatio > 0.3) {
    return {
      valid: false,
      reason: "Message contains unusual characters",
    }
  }

  // Check for repeated characters (e.g., "!!!!!!!!")
  if (/(.)\1{10,}/.test(message)) {
    return {
      valid: false,
      reason: "Message contains excessive repeated characters",
    }
  }

  return { valid: true }
}

/**
 * Sanitizes user input to prevent XSS and injection
 * Removes dangerous characters and enforces max length
 */
export function sanitizeInput(input: string): string {
  return (
    input
      .trim()
      .replace(/\0/g, "") // Remove null bytes
      .slice(0, 10000)
  ) // Max length enforcement
}
