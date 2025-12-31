"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ExitIntentPopup } from "@/components/exit-intent-popup"
import { useExitIntent } from "@/hooks/use-exit-intent"
import { useAuth } from "@/contexts/auth-context"

export function ExitIntentProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()

  // Only show on homepage and plan builder pages
  const enabledPaths = ["/", "/plan-builder"]

  // Don't show to already subscribed users
  const shouldEnable = !user?.subscriptionStatus || user.subscriptionStatus === "none"

  const { shouldShow, dismiss } = useExitIntent({
    delay: 5000, // Wait 5 seconds before enabling
    maxDisplays: 1, // Show only once per user
    sensitivity: 50, // Trigger when mouse is within 50px of top
    enabledPaths: shouldEnable ? enabledPaths : [],
  })

  return (
    <>
      {children}
      <ExitIntentPopup open={shouldShow} onOpenChange={(open) => !open && dismiss()} />
    </>
  )
}
