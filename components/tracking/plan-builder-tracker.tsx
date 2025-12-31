"use client"

import { useEffect } from "react"
import { metaPixelEvents } from "@/components/meta-pixel"

interface PlanBuilderTrackerProps {
  step?: number
  estimatedValue?: number
}

/**
 * Client component to track ViewContent event for Meta Pixel
 * Place this in the plan builder to fire when user views the plan builder
 */
export function PlanBuilderTracker({ step, estimatedValue }: PlanBuilderTrackerProps) {
  useEffect(() => {
    // Only track if we have valid data
    if (typeof window === "undefined") return

    try {
      // Track plan builder view
      metaPixelEvents.viewContent({
        content_name: step ? `Plan Builder - Step ${step}` : "Plan Builder",
        content_category: "plan_builder",
        value: estimatedValue,
      })
    } catch (error) {
      // Silently fail - don't break the page if tracking fails
      console.warn("[PlanBuilderTracker] Failed to track event:", error)
    }
  }, [step, estimatedValue])

  return null // This component doesn't render anything
}
