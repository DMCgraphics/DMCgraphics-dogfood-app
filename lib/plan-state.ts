"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

export type PlanUiState = "active" | "in_progress" | "none"

export function usePlanUiState() {
  const [state, setState] = useState<PlanUiState>("none")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
          if (mounted) {
            setState("none")
            setLoading(false)
          }
          return
        }

        const { data: subscriptions } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", session.user.id)
          .in("status", ["active", "trialing", "past_due"])

        if (subscriptions && subscriptions.length > 0) {
          if (mounted) setState("active")
          return
        }

        const { data: plans } = await supabase
          .from("plans")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(1)

        if (plans && plans.length > 0) {
          const plan = plans[0]
          if (mounted) {
            setState(plan.status === "active" ? "active" : "in_progress")
          }
        } else {
          if (mounted) setState("none")
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  return { state, loading }
}
