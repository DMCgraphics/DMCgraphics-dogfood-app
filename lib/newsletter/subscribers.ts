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
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        marketing_opt_in,
        subscriptions!inner (
          id,
          status
        )
      `)
      .eq("marketing_opt_in", true)
      .in("subscriptions.status", ["active", "trialing", "past_due"])

    if (error) {
      console.error("[Subscribers] Query error:", error)
      throw new Error(`Failed to fetch subscribers: ${error.message}`)
    }

    // Deduplicate users (in case multiple subscriptions)
    const uniqueSubscribers = new Map<string, NewsletterSubscriber>()

    data?.forEach((profile: any) => {
      if (!uniqueSubscribers.has(profile.id)) {
        uniqueSubscribers.set(profile.id, {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name || "Valued Customer",
          marketing_opt_in: profile.marketing_opt_in,
        })
      }
    })

    const subscribers = Array.from(uniqueSubscribers.values())

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
