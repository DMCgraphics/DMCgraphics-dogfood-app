import { supabaseAdmin } from "@/lib/supabase/server"

export interface NewsletterSubscriber {
  id: string
  email: string
  full_name: string
  marketing_opt_in: boolean
}

/**
 * Get all active subscribers eligible for newsletter
 * Active = has active/trialing/past_due subscription + marketing opt-in
 */
export async function getActiveNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  try {
    // Get active subscriptions with user IDs
    const { data: activeSubs, error: subsError } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id")
      .in("status", ["active", "trialing", "past_due"])

    if (subsError) {
      console.error("[Subscribers] Query error:", subsError)
      throw new Error(`Failed to fetch active subscriptions: ${subsError.message}`)
    }

    if (!activeSubs || activeSubs.length === 0) {
      console.log("[Subscribers] No active subscriptions found")
      return []
    }

    // Get unique user IDs
    const userIds = [...new Set(activeSubs.map(sub => sub.user_id))]

    // Get profiles for those users who are opted in
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, marketing_opt_in")
      .in("id", userIds)
      .eq("marketing_opt_in", true)

    if (error) {
      console.error("[Subscribers] Query error:", error)
      throw new Error(`Failed to fetch subscribers: ${error.message}`)
    }

    const subscribers = (data || []).map((profile: any) => ({
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name || "Valued Customer",
      marketing_opt_in: profile.marketing_opt_in,
    }))

    console.log(`[Subscribers] Found ${subscribers.length} eligible subscribers`)

    return subscribers
  } catch (error) {
    console.error("[Subscribers] Error:", error)
    throw error
  }
}

/**
 * Check if user has already received newsletter for given month
 */
export async function hasReceivedNewsletter(
  userId: string,
  newsletterMonth: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("newsletter_sends")
    .select("id")
    .eq("user_id", userId)
    .eq("newsletter_month", newsletterMonth)
    .eq("status", "sent")
    .single()

  return !!data && !error
}
