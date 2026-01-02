"use client"

import { Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CompletionTimeBadgeProps {
  currentStep: number
  totalSteps: number
}

export function CompletionTimeBadge({ currentStep, totalSteps }: CompletionTimeBadgeProps) {
  const minutesRemaining = Math.max(0, (totalSteps - currentStep) * 0.5)

  const displayText = currentStep >= totalSteps - 1
    ? "Almost done!"
    : `~${Math.ceil(minutesRemaining)} min to complete`

  return (
    <Badge className="text-xs md:text-sm flex items-center gap-1 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-800">
      <Clock className="h-3 w-3" />
      {displayText}
    </Badge>
  )
}
