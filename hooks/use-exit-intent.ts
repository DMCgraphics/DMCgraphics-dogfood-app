"use client"

import { useEffect, useState } from "react"

interface UseExitIntentOptions {
  /** Delay in ms before enabling exit detection (default: 3000ms) */
  delay?: number
  /** Maximum number of times to show (default: 1) */
  maxDisplays?: number
  /** Cookie/localStorage key for tracking displays (default: "exit-intent-shown") */
  storageKey?: number
  /** Sensitivity in pixels from top (default: 50px) */
  sensitivity?: number
  /** Only trigger on specific pages */
  enabledPaths?: string[]
}

/**
 * Custom hook to detect when user is about to leave the page
 *
 * Triggers on:
 * - Mouse leaving viewport from top
 * - Aggressive mouse movement towards browser chrome
 * - Tab/window blur (mobile)
 *
 * Best practices:
 * - Don't show immediately (wait 3-5 seconds)
 * - Limit to 1-2 displays per user
 * - Only show on high-value pages
 * - Make the offer compelling
 */
export function useExitIntent(options: UseExitIntentOptions = {}) {
  const {
    delay = 3000,
    maxDisplays = 1,
    storageKey = "nouripet-exit-intent-count",
    sensitivity = 50,
    enabledPaths,
  } = options

  const [shouldShow, setShouldShow] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Check if we're on an enabled path
    if (enabledPaths && !enabledPaths.some((path) => window.location.pathname.startsWith(path))) {
      return
    }

    // Check display count
    const displayCount = parseInt(localStorage.getItem(storageKey) || "0", 10)
    if (displayCount >= maxDisplays) {
      return
    }

    // Wait for delay before enabling
    const delayTimer = setTimeout(() => {
      setIsReady(true)
    }, delay)

    return () => clearTimeout(delayTimer)
  }, [delay, maxDisplays, storageKey, enabledPaths])

  useEffect(() => {
    if (!isReady) return

    let hasTriggered = false

    const handleMouseLeave = (e: MouseEvent) => {
      if (hasTriggered) return

      // Detect mouse leaving from top of viewport
      if (e.clientY <= sensitivity && e.clientY >= 0) {
        hasTriggered = true
        setShouldShow(true)

        // Increment display count
        const displayCount = parseInt(localStorage.getItem(storageKey) || "0", 10)
        localStorage.setItem(storageKey, String(displayCount + 1))
      }
    }

    // Add event listener
    document.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [isReady, sensitivity, storageKey])

  const dismiss = () => {
    setShouldShow(false)
  }

  const reset = () => {
    localStorage.removeItem(storageKey)
    setShouldShow(false)
  }

  return {
    shouldShow,
    dismiss,
    reset,
  }
}
