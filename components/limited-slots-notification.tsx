"use client"

import { useState, useEffect } from "react"
import { Clock, TrendingUp, AlertCircle } from "lucide-react"

interface LimitedSlotsNotificationProps {
  variant?: "default" | "inline" | "banner"
  className?: string
}

export function LimitedSlotsNotification({
  variant = "default",
  className = ""
}: LimitedSlotsNotificationProps) {
  const [slotsRemaining, setSlotsRemaining] = useState<number>(3)
  const [timeLeft, setTimeLeft] = useState<string>("")

  useEffect(() => {
    // Generate a semi-random number of slots (2-5) that stays consistent per session
    const sessionSlots = sessionStorage.getItem('nouripet-slots-remaining')
    if (sessionSlots) {
      setSlotsRemaining(parseInt(sessionSlots))
    } else {
      const randomSlots = Math.floor(Math.random() * 4) + 2 // 2-5 slots
      sessionStorage.setItem('nouripet-slots-remaining', randomSlots.toString())
      setSlotsRemaining(randomSlots)
    }

    // Calculate time until end of current week (Sunday 11:59 PM)
    const updateTimeLeft = () => {
      const now = new Date()
      const dayOfWeek = now.getDay() // 0 = Sunday, 6 = Saturday
      const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek

      const endOfWeek = new Date(now)
      endOfWeek.setDate(now.getDate() + daysUntilSunday)
      endOfWeek.setHours(23, 59, 59, 999)

      const diff = endOfWeek.getTime() - now.getTime()
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`)
      } else {
        setTimeLeft(`${hours}h`)
      }
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  if (variant === "inline") {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1.5 text-sm">
          <div className="relative">
            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-orange-600 rounded-full animate-pulse" />
          </div>
          <span className="font-semibold text-orange-600 dark:text-orange-400">
            Only {slotsRemaining} delivery slots left this week
          </span>
        </div>
      </div>
    )
  }

  if (variant === "banner") {
    return (
      <div className={`bg-gradient-to-r from-orange-500 to-orange-600 text-white ${className}`}>
        <div className="container py-3">
          <div className="flex items-center justify-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Clock className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-white rounded-full animate-pulse" />
              </div>
              <span className="font-bold">Limited Availability:</span>
            </div>
            <span>
              Only <strong>{slotsRemaining} delivery slots</strong> remaining for this week's delivery
            </span>
            {timeLeft && (
              <span className="hidden sm:inline bg-white/20 px-2 py-0.5 rounded text-xs font-semibold">
                {timeLeft} left
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Default variant - card style
  return (
    <div className={`bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full flex-shrink-0">
          <div className="relative">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-orange-600 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-orange-900 dark:text-orange-100">
              Limited Delivery Slots Available
            </h3>
            {timeLeft && (
              <span className="text-xs font-semibold bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-0.5 rounded-full">
                {timeLeft} left
              </span>
            )}
          </div>
          <p className="text-sm text-orange-800 dark:text-orange-200">
            Only <strong>{slotsRemaining} delivery slots</strong> remaining for this week in your area.
            Secure your spot today for fresh, local delivery.
          </p>
        </div>
        <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
      </div>
    </div>
  )
}
