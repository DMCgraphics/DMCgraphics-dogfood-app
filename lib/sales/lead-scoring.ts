/**
 * Lead Scoring Algorithm
 *
 * Calculates conversion probability (0-100) based on multiple factors:
 * - Source type (how they found us)
 * - Customer journey progress (draft plan, checkout started, etc.)
 * - Engagement indicators (email opened, time on site)
 * - Recency (how long since last contact)
 * - Purchase history (individual packs indicate interest)
 */

interface Lead {
  id: string
  source: string
  status: string
  last_contacted_at: string | null
  conversion_probability: number
  source_metadata?: Record<string, any>
  created_at: string
}

interface ScoringFactors {
  baseScore: number
  journeyBonus: number
  engagementBonus: number
  recencyPenalty: number
  purchaseBonus: number
}

/**
 * Base scores by source type
 */
const SOURCE_SCORES: Record<string, number> = {
  event_signup: 60,          // High intent - came to event
  individual_pack: 70,       // Very high intent - already purchased
  early_access: 55,          // Good intent - signed up early
  abandoned_plan: 50,        // Medium intent - started but stopped
  incomplete_checkout: 65,   // High intent - almost purchased
  contact_form: 45,          // Medium intent - asking questions
  medical_request: 50,       // Medium intent - specific need
  manual: 40,                // Unknown intent - manually added
}

/**
 * Journey progression bonuses
 */
const JOURNEY_BONUSES = {
  draft_plan_created: 15,
  checkout_started: 20,
  payment_method_added: 25,
  email_opened: 5,
  link_clicked: 10,
}

/**
 * Calculate lead score
 */
export function calculateLeadScore(lead: Lead, metadata?: Record<string, any>): number {
  const factors: ScoringFactors = {
    baseScore: SOURCE_SCORES[lead.source] || 40,
    journeyBonus: 0,
    engagementBonus: 0,
    recencyPenalty: 0,
    purchaseBonus: 0,
  }

  // Journey progression bonuses
  const meta = metadata || lead.source_metadata || {}

  if (meta.has_draft_plan || meta.draft_plan_id) {
    factors.journeyBonus += JOURNEY_BONUSES.draft_plan_created
  }

  if (meta.checkout_started || meta.checkout_session_id) {
    factors.journeyBonus += JOURNEY_BONUSES.checkout_started
  }

  if (meta.has_payment_method) {
    factors.journeyBonus += JOURNEY_BONUSES.payment_method_added
  }

  // Engagement bonuses
  if (meta.email_opened) {
    factors.engagementBonus += JOURNEY_BONUSES.email_opened
  }

  if (meta.link_clicked || meta.clicks > 0) {
    factors.engagementBonus += JOURNEY_BONUSES.link_clicked
  }

  // Purchase history bonus
  if (meta.purchase_count > 0) {
    factors.purchaseBonus += 10 * meta.purchase_count // 10 points per purchase
  }

  if (meta.total_spent > 0) {
    factors.purchaseBonus += Math.min(15, Math.floor(meta.total_spent / 100)) // 1 point per $100 spent, max 15
  }

  // Recency penalty (leads get colder over time)
  if (lead.last_contacted_at) {
    const daysSinceContact = Math.floor(
      (Date.now() - new Date(lead.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceContact > 30) {
      factors.recencyPenalty = Math.min(20, (daysSinceContact - 30) * 0.5) // -0.5 per day after 30 days, max -20
    }
  } else {
    // Never contacted - check how long since created
    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceCreated > 7) {
      factors.recencyPenalty = Math.min(15, (daysSinceCreated - 7) * 1) // -1 per day after 7 days, max -15
    }
  }

  // Calculate final score
  const totalScore =
    factors.baseScore +
    factors.journeyBonus +
    factors.engagementBonus +
    factors.purchaseBonus -
    factors.recencyPenalty

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(totalScore)))
}

/**
 * Determine priority level based on score
 */
export function scoreToPriority(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 70) return 'hot'
  if (score >= 50) return 'warm'
  return 'cold'
}

/**
 * Batch update scores for multiple leads
 */
export function calculateLeadScores(leads: Lead[], metadataMap?: Map<string, Record<string, any>>): Map<string, { score: number; priority: string }> {
  const results = new Map<string, { score: number; priority: string }>()

  for (const lead of leads) {
    const metadata = metadataMap?.get(lead.id)
    const score = calculateLeadScore(lead, metadata)
    const priority = scoreToPriority(score)

    results.set(lead.id, { score, priority })
  }

  return results
}

/**
 * Suggest next action based on lead score and status
 */
export function suggestNextAction(lead: Lead): string {
  const score = lead.conversion_probability
  const status = lead.status

  // Hot leads (70+)
  if (score >= 70) {
    if (status === 'new') return 'Call immediately - high intent lead'
    if (status === 'contacted') return 'Follow up within 24 hours'
    if (status === 'qualified') return 'Send personalized pricing and close'
    if (status === 'nurturing') return 'This should be qualified - move to close'
  }

  // Warm leads (50-69)
  if (score >= 50) {
    if (status === 'new') return 'Email introduction and schedule call'
    if (status === 'contacted') return 'Follow up in 2-3 days'
    if (status === 'qualified') return 'Send proposal and pricing'
    if (status === 'nurturing') return 'Share case studies and testimonials'
  }

  // Cold leads (0-49)
  if (status === 'new') return 'Add to email nurture sequence'
  if (status === 'contacted') return 'Follow up in 1 week'
  if (status === 'qualified') return 'Re-qualify - may be cold'
  if (status === 'nurturing') return 'Monthly check-in email'

  return 'Review lead and update status'
}
