/**
 * Contact Form Rate Limiting
 *
 * Privacy-preserving rate limiting for contact form submissions
 * - IP addresses are hashed with SHA-256 (never stored in raw form)
 * - Follows fail-open philosophy: allows submissions if database errors occur
 * - Tracks both IP-based and email-based limits
 */

import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

export interface RateLimitResult {
  allowed: boolean
  reason?: string
  resetAt?: Date
  currentCount?: number
  limit?: number
}

export interface RateLimitConfig {
  submissionsPerHour: number
  submissionsPerDay: number
  emailCooldownMinutes: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
  submissionsPerHour: 5,
  submissionsPerDay: 10,
  emailCooldownMinutes: 60,
}

/**
 * Hash IP address with SHA-256 for privacy
 * Uses environment variable salt for security
 */
function hashIpAddress(ipAddress: string): string {
  const salt = process.env.IP_HASH_SALT || "default-salt-change-me-in-production"
  return crypto
    .createHash("sha256")
    .update(ipAddress + salt)
    .digest("hex")
}

/**
 * Extract IP address from Next.js request
 * Handles Vercel deployment with x-forwarded-for header
 */
export function extractIpAddress(req: Request): string | null {
  // Try x-forwarded-for first (Vercel uses this)
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    // Take the first IP (client IP)
    const ips = forwarded.split(",").map((ip) => ip.trim())
    return ips[0] || null
  }

  // Try x-real-ip
  const realIp = req.headers.get("x-real-ip")
  if (realIp) {
    return realIp
  }

  // Fallback - may not be available in Edge runtime
  return null
}

/**
 * Hash IP address for storage (exported for use in API route)
 */
export function hashIp(ipAddress: string): string {
  return hashIpAddress(ipAddress)
}

/**
 * Check hourly rate limit by IP hash
 */
async function checkIpHourlyLimit(
  ipHash: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<RateLimitResult> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)

    const { count, error } = await supabase
      .from("contact_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", oneHourAgo.toISOString())

    if (error) {
      console.error("[rate-limit] Error checking hourly limit:", error)
      return { allowed: true } // Fail open
    }

    const currentCount = count || 0

    if (currentCount >= config.submissionsPerHour) {
      const resetAt = new Date()
      resetAt.setHours(resetAt.getHours() + 1)

      return {
        allowed: false,
        reason: `Too many submissions. Please wait before submitting again.`,
        resetAt,
        currentCount,
        limit: config.submissionsPerHour,
      }
    }

    return { allowed: true }
  } catch (error) {
    console.error("[rate-limit] Exception in checkIpHourlyLimit:", error)
    return { allowed: true } // Fail open on exception
  }
}

/**
 * Check daily rate limit by IP hash
 */
async function checkIpDailyLimit(
  ipHash: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<RateLimitResult> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const { count, error } = await supabase
      .from("contact_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", oneDayAgo.toISOString())

    if (error) {
      console.error("[rate-limit] Error checking daily limit:", error)
      return { allowed: true } // Fail open
    }

    const currentCount = count || 0

    if (currentCount >= config.submissionsPerDay) {
      const resetAt = new Date()
      resetAt.setDate(resetAt.getDate() + 1)

      return {
        allowed: false,
        reason: `Daily submission limit reached. Please try again tomorrow.`,
        resetAt,
        currentCount,
        limit: config.submissionsPerDay,
      }
    }

    return { allowed: true }
  } catch (error) {
    console.error("[rate-limit] Exception in checkIpDailyLimit:", error)
    return { allowed: true } // Fail open on exception
  }
}

/**
 * Check email duplicate (cooldown period)
 * Prevents same email from submitting multiple times within cooldown window
 */
async function checkEmailCooldown(
  email: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<RateLimitResult> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const cooldownTime = new Date()
    cooldownTime.setMinutes(
      cooldownTime.getMinutes() - config.emailCooldownMinutes
    )

    const { data, error } = await supabase
      .from("contact_submissions")
      .select("created_at")
      .eq("email", email.toLowerCase().trim())
      .gte("created_at", cooldownTime.toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error("[rate-limit] Error checking email cooldown:", error)
      return { allowed: true } // Fail open
    }

    if (data) {
      const resetAt = new Date(data.created_at)
      resetAt.setMinutes(resetAt.getMinutes() + config.emailCooldownMinutes)

      return {
        allowed: false,
        reason: `You've already submitted a message recently. Please wait before submitting again.`,
        resetAt,
      }
    }

    return { allowed: true }
  } catch (error) {
    console.error("[rate-limit] Exception in checkEmailCooldown:", error)
    return { allowed: true } // Fail open on exception
  }
}

/**
 * Record submission for rate limiting
 * Stores hashed IP in contact_rate_limits table
 */
async function recordSubmission(ipHash: string): Promise<void> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from("contact_rate_limits")
      .insert({ ip_hash: ipHash })

    if (error) {
      console.error("[rate-limit] Error recording submission:", error)
      // Don't throw - this is tracking only
    }
  } catch (error) {
    console.error("[rate-limit] Exception in recordSubmission:", error)
    // Don't throw - tracking failure shouldn't block submissions
  }
}

/**
 * Main rate limit check function
 * Checks IP-based hourly/daily limits and email cooldown
 *
 * @param req - Next.js Request object
 * @param email - Email address from form submission
 * @param config - Optional rate limit configuration
 * @returns RateLimitResult indicating if submission is allowed
 */
export async function checkContactRateLimits(
  req: Request,
  email: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<RateLimitResult> {
  // Extract and hash IP
  const ipAddress = extractIpAddress(req)

  if (!ipAddress) {
    console.warn("[rate-limit] No IP address found, skipping IP-based limits")
    // Still check email cooldown even without IP
    return await checkEmailCooldown(email, config)
  }

  const ipHash = hashIpAddress(ipAddress)

  // Check hourly limit
  const hourlyCheck = await checkIpHourlyLimit(ipHash, config)
  if (!hourlyCheck.allowed) {
    return hourlyCheck
  }

  // Check daily limit
  const dailyCheck = await checkIpDailyLimit(ipHash, config)
  if (!dailyCheck.allowed) {
    return dailyCheck
  }

  // Check email cooldown
  const emailCheck = await checkEmailCooldown(email, config)
  if (!emailCheck.allowed) {
    return emailCheck
  }

  // All checks passed - record this submission
  await recordSubmission(ipHash)

  return { allowed: true }
}
