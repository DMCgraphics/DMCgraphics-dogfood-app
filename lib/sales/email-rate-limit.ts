/**
 * Email rate limiting for sales team
 * Prevents abuse by limiting number of emails per user/lead
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface RateLimitConfig {
  emailsPerUserPerHour: number
  emailsPerUserPerDay: number
  emailsPerLeadPerDay: number
}

const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  emailsPerUserPerHour: 50,
  emailsPerUserPerDay: 200,
  emailsPerLeadPerDay: 5,
}

interface RateLimitResult {
  allowed: boolean
  reason?: string
  resetAt?: Date
  currentCount?: number
  limit?: number
}

/**
 * Check if user has exceeded hourly email limit
 */
export async function checkUserHourlyLimit(
  userId: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMITS
): Promise<RateLimitResult> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const oneHourAgo = new Date()
  oneHourAgo.setHours(oneHourAgo.getHours() - 1)

  const { count, error } = await supabase
    .from('sales_activities')
    .select('*', { count: 'exact', head: true })
    .eq('performed_by', userId)
    .eq('activity_type', 'email')
    .gte('created_at', oneHourAgo.toISOString())

  if (error) {
    console.error('Error checking hourly rate limit:', error)
    return { allowed: true } // Fail open
  }

  const currentCount = count || 0

  if (currentCount >= config.emailsPerUserPerHour) {
    const resetAt = new Date(oneHourAgo)
    resetAt.setHours(resetAt.getHours() + 1)

    return {
      allowed: false,
      reason: `Hourly email limit reached. You can send ${config.emailsPerUserPerHour} emails per hour.`,
      resetAt,
      currentCount,
      limit: config.emailsPerUserPerHour,
    }
  }

  return { allowed: true, currentCount, limit: config.emailsPerUserPerHour }
}

/**
 * Check if user has exceeded daily email limit
 */
export async function checkUserDailyLimit(
  userId: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMITS
): Promise<RateLimitResult> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)

  const { count, error } = await supabase
    .from('sales_activities')
    .select('*', { count: 'exact', head: true })
    .eq('performed_by', userId)
    .eq('activity_type', 'email')
    .gte('created_at', oneDayAgo.toISOString())

  if (error) {
    console.error('Error checking daily rate limit:', error)
    return { allowed: true } // Fail open
  }

  const currentCount = count || 0

  if (currentCount >= config.emailsPerUserPerDay) {
    const resetAt = new Date(oneDayAgo)
    resetAt.setDate(resetAt.getDate() + 1)

    return {
      allowed: false,
      reason: `Daily email limit reached. You can send ${config.emailsPerUserPerDay} emails per day.`,
      resetAt,
      currentCount,
      limit: config.emailsPerUserPerDay,
    }
  }

  return { allowed: true, currentCount, limit: config.emailsPerUserPerDay }
}

/**
 * Check if lead has received too many emails today
 */
export async function checkLeadDailyLimit(
  leadId: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMITS
): Promise<RateLimitResult> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)

  const { count, error } = await supabase
    .from('sales_activities')
    .select('*', { count: 'exact', head: true })
    .eq('lead_id', leadId)
    .eq('activity_type', 'email')
    .gte('created_at', oneDayAgo.toISOString())

  if (error) {
    console.error('Error checking lead rate limit:', error)
    return { allowed: true } // Fail open
  }

  const currentCount = count || 0

  if (currentCount >= config.emailsPerLeadPerDay) {
    const resetAt = new Date(oneDayAgo)
    resetAt.setDate(resetAt.getDate() + 1)

    return {
      allowed: false,
      reason: `This lead has already received ${config.emailsPerLeadPerDay} emails today. Please try again tomorrow.`,
      resetAt,
      currentCount,
      limit: config.emailsPerLeadPerDay,
    }
  }

  return { allowed: true, currentCount, limit: config.emailsPerLeadPerDay }
}

/**
 * Check all rate limits for sending an email
 * Returns the first limit that is exceeded
 */
export async function checkEmailRateLimits(
  userId: string,
  leadId: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMITS
): Promise<RateLimitResult> {
  // Check hourly limit
  const hourlyCheck = await checkUserHourlyLimit(userId, config)
  if (!hourlyCheck.allowed) {
    return hourlyCheck
  }

  // Check daily limit
  const dailyCheck = await checkUserDailyLimit(userId, config)
  if (!dailyCheck.allowed) {
    return dailyCheck
  }

  // Check lead limit
  const leadCheck = await checkLeadDailyLimit(leadId, config)
  if (!leadCheck.allowed) {
    return leadCheck
  }

  return { allowed: true }
}
