"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { PromoModal } from "./promo-modal"

const PROMO_DISMISSED_KEY = "nouripet-holiday-promo-dismissed"

export function PromoModalProvider() {
  const [showPromo, setShowPromo] = useState(false)
  const pathname = usePathname()
  const { user, hasSubscription, isLoading } = useAuth()

  useEffect(() => {
    // Only run on home page
    if (pathname !== '/') {
      setShowPromo(false)
      return
    }

    // Wait for auth to load
    if (isLoading) {
      return
    }

    // Check if user has already dismissed the promo
    const dismissed = localStorage.getItem(PROMO_DISMISSED_KEY)
    if (dismissed) {
      setShowPromo(false)
      return
    }

    // Don't show if user is logged in and has an active subscription
    if (user && hasSubscription) {
      setShowPromo(false)
      return
    }

    // Show promo to:
    // - Not logged in users
    // - Logged in users without a subscription
    setShowPromo(true)
  }, [pathname, user, hasSubscription, isLoading])

  const handleDismiss = (open: boolean) => {
    if (!open) {
      localStorage.setItem(PROMO_DISMISSED_KEY, 'true')
      setShowPromo(false)
    }
  }

  return <PromoModal open={showPromo} onOpenChange={handleDismiss} />
}
