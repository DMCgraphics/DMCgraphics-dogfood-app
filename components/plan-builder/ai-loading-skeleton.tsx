"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Skeleton loader for AI recommendation card
 */
export function AIRecommendationSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 animate-pulse", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-400 animate-spin" />
          <div className="h-5 w-48 bg-blue-200 rounded"></div>
          <div className="ml-auto h-5 w-20 bg-blue-200 rounded"></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-white/60 rounded-lg">
          <div className="space-y-2">
            <div className="h-4 w-full bg-blue-100 rounded"></div>
            <div className="h-4 w-3/4 bg-blue-100 rounded"></div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-4 w-40 bg-blue-100 rounded"></div>
          <div className="flex gap-2">
            <div className="h-6 w-24 bg-blue-100 rounded"></div>
            <div className="h-6 w-32 bg-blue-100 rounded"></div>
            <div className="h-6 w-28 bg-blue-100 rounded"></div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="h-4 w-40 bg-blue-100 rounded"></div>
          <div className="p-3 rounded-lg border bg-white/60">
            <div className="space-y-2">
              <div className="h-5 w-48 bg-blue-100 rounded"></div>
              <div className="h-3 w-32 bg-blue-100 rounded"></div>
            </div>
          </div>
          <div className="p-3 rounded-lg border bg-white/60">
            <div className="space-y-2">
              <div className="h-5 w-52 bg-blue-100 rounded"></div>
              <div className="h-3 w-36 bg-blue-100 rounded"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Inline AI thinking indicator
 */
export function AIThinking({ message = "AI is thinking...", className }: { message?: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      <span className="animate-pulse">{message}</span>
    </div>
  )
}

/**
 * Skeleton for confidence breakdown
 */
export function ConfidenceBreakdownSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-3 w-24 bg-slate-200 rounded"></div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-16 bg-slate-200 rounded"></div>
            <div className="h-6 w-32 bg-slate-200 rounded"></div>
          </div>
        </div>
        <div className="h-8 w-20 bg-slate-200 rounded"></div>
      </div>

      <div className="w-full h-3 bg-slate-200 rounded-full"></div>

      <div className="space-y-2 mt-4">
        <div className="h-4 w-40 bg-slate-200 rounded"></div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-100">
              <div className="flex-1 space-y-1">
                <div className="h-4 w-48 bg-slate-200 rounded"></div>
                <div className="h-3 w-full bg-slate-200 rounded"></div>
              </div>
              <div className="h-5 w-12 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton for factor list
 */
export function FactorListSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 gap-3 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="border rounded-lg p-3">
          <div className="flex justify-between items-start mb-2">
            <div className="h-4 w-32 bg-slate-200 rounded"></div>
            <div className="h-5 w-12 bg-slate-200 rounded"></div>
          </div>
          <div className="flex gap-2 mb-2">
            <div className="h-4 w-16 bg-slate-200 rounded"></div>
            <div className="h-4 w-12 bg-slate-200 rounded"></div>
          </div>
          <div className="h-3 w-full bg-slate-200 rounded"></div>
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton for alternative recommendations
 */
export function AlternativeRecommendationsSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-3">
          <div className="flex justify-between items-start mb-2">
            <div className="h-5 w-48 bg-slate-200 rounded"></div>
            <div className="h-5 w-16 bg-slate-200 rounded"></div>
          </div>
          <div className="h-4 w-full bg-slate-200 rounded mb-2"></div>
          <div className="h-3 w-3/4 bg-slate-200 rounded"></div>
        </div>
      ))}
    </div>
  )
}

/**
 * Shimmer effect for loading states
 */
export function ShimmerEffect({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-slate-100 rounded", className)}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100"></div>
    </div>
  )
}

/**
 * Pulsing dots for "thinking" state
 */
export function PulsingDots() {
  return (
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: "0ms" }}></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: "150ms" }}></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: "300ms" }}></div>
    </div>
  )
}
