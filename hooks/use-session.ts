"use client"

import { useAuth } from "@/contexts/auth-context"
import { hasValidSubscription } from "@/lib/route-guards"
import { useState, useEffect } from "react"

export function useSession() {
  const auth = useAuth()
  const [hasSubscription, setHasSubscription] = useState(false)

  useEffect(() => {
    if (auth.isAuthenticated) {
      const checkSubscription = () => {
        try {
          const isValid = hasValidSubscription()
          setHasSubscription(isValid)
        } catch (error) {
          console.error("Error checking subscription:", error)
          setHasSubscription(false)
        }
      }

      checkSubscription()

      // Listen for subscription changes
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "nouripet_order" || e.key === null) {
          setTimeout(checkSubscription, 0)
        }
      }

      window.addEventListener("storage", handleStorageChange)
      return () => window.removeEventListener("storage", handleStorageChange)
    } else {
      setHasSubscription(false)
    }
  }, [auth.isAuthenticated])

  return {
    ...auth,
    hasSubscription,
  }
}
