"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

export function useAuth() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  return {
    user,
    loading,
    isAuthenticated: !!user,
  }
}
