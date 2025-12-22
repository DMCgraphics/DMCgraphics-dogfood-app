"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { format } from "date-fns"
import { getNextBatchDate, calculateTimeRemaining, type TimeRemaining } from "@/lib/batch-schedule"
import { cn } from "@/lib/utils"

interface CountdownTimerProps {
  className?: string
}

interface DigitDisplayProps {
  value: number
  label: string
}

function DigitDisplay({ value, label }: DigitDisplayProps) {
  const displayValue = String(value).padStart(2, '0')

  return (
    <div className="flex flex-col items-center">
      <div className={cn(
        "relative bg-gradient-to-br from-primary to-primary/80 rounded-lg shadow-lg",
        "w-16 h-20 sm:w-20 sm:h-24 md:w-24 md:h-28 flex items-center justify-center",
        "border-2 border-primary/30"
      )}>
        <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-foreground">
          {displayValue}
        </div>
      </div>
      <span className="text-xs sm:text-sm text-muted-foreground mt-2 font-medium">
        {label}
      </span>
    </div>
  )
}

export function CountdownTimer({ className }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null)
  const [nextBatchDate, setNextBatchDate] = useState<Date | null>(null)

  useEffect(() => {
    // Initial calculation
    const nextBatch = getNextBatchDate()
    setNextBatchDate(nextBatch)
    setTimeRemaining(calculateTimeRemaining(nextBatch))

    // Update every second
    const intervalId = setInterval(() => {
      const now = new Date()
      const remaining = calculateTimeRemaining(nextBatch, now)

      // Check if countdown reached zero - recalculate next batch
      if (remaining.total <= 0) {
        const newNextBatch = getNextBatchDate(now)
        setNextBatchDate(newNextBatch)
        setTimeRemaining(calculateTimeRemaining(newNextBatch, now))
      } else {
        setTimeRemaining(remaining)
      }
    }, 1000)

    // Cleanup on unmount
    return () => clearInterval(intervalId)
  }, [])

  // Loading state
  if (!timeRemaining || !nextBatchDate) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="h-5 w-5 animate-pulse" />
            <span>Calculating next batch...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      "overflow-hidden bg-gradient-to-br from-green-50 via-blue-50 to-cyan-50",
      "border-2 border-primary/20 shadow-lg hover:shadow-xl transition-shadow",
      "animate-gradient-wave",
      className
    )}>
      <CardHeader className="text-center pb-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            <h3 className="text-2xl font-bold text-primary">Next Fresh Batch</h3>
          </div>
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Cooking Soon
          </Badge>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          {format(nextBatchDate, 'EEEE, MMMM d')} at {format(nextBatchDate, 'h:mm a')}
        </p>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-2xl mx-auto">
          <DigitDisplay
            value={timeRemaining.days}
            label="Days"
          />
          <DigitDisplay
            value={timeRemaining.hours}
            label="Hours"
          />
          <DigitDisplay
            value={timeRemaining.minutes}
            label="Mins"
          />
          <DigitDisplay
            value={timeRemaining.seconds}
            label="Secs"
          />
        </div>
      </CardContent>
    </Card>
  )
}
