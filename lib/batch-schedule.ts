import { addDays, differenceInDays, setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns"

/**
 * Configuration for batch schedule
 */
const BATCH_START_DATE = new Date('2025-12-25T19:00:00') // Reference Thursday 7 PM
const BATCH_INTERVAL_DAYS = 14 // Bi-weekly (every 2 weeks)
const BATCH_HOUR = 19 // 7 PM
const BATCH_MINUTE = 0
const BATCH_SECOND = 0

export interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number // Total milliseconds remaining
}

/**
 * Calculate the next batch date based on bi-weekly Thursday 7 PM schedule
 * @param currentDate Optional current date (defaults to now)
 * @returns Next batch date
 */
export function getNextBatchDate(currentDate: Date = new Date()): Date {
  // Normalize the reference date to exactly 7 PM
  let referenceDate = setMilliseconds(
    setSeconds(
      setMinutes(
        setHours(BATCH_START_DATE, BATCH_HOUR),
        BATCH_MINUTE
      ),
      BATCH_SECOND
    ),
    0
  )

  // Calculate days elapsed since reference date
  const daysSinceReference = differenceInDays(currentDate, referenceDate)

  // If we haven't reached the reference date yet, return it
  if (daysSinceReference < 0) {
    return referenceDate
  }

  // Calculate how many batch intervals have passed
  const intervalsPassed = Math.floor(daysSinceReference / BATCH_INTERVAL_DAYS)

  // Calculate the most recent batch date
  const lastBatchDate = addDays(referenceDate, intervalsPassed * BATCH_INTERVAL_DAYS)

  // If current time is before the last batch date, return it
  if (currentDate < lastBatchDate) {
    return lastBatchDate
  }

  // Otherwise, return the next batch date
  const nextBatchDate = addDays(lastBatchDate, BATCH_INTERVAL_DAYS)

  return nextBatchDate
}

/**
 * Calculate time remaining until target date
 * @param targetDate The target date to count down to
 * @param currentDate Optional current date (defaults to now)
 * @returns Object with days, hours, minutes, seconds, and total milliseconds
 */
export function calculateTimeRemaining(
  targetDate: Date,
  currentDate: Date = new Date()
): TimeRemaining {
  const totalMs = targetDate.getTime() - currentDate.getTime()

  // If time has passed, return zeros
  if (totalMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      total: 0,
    }
  }

  const totalSeconds = Math.floor(totalMs / 1000)
  const totalMinutes = Math.floor(totalSeconds / 60)
  const totalHours = Math.floor(totalMinutes / 60)
  const days = Math.floor(totalHours / 24)

  const hours = totalHours % 24
  const minutes = totalMinutes % 60
  const seconds = totalSeconds % 60

  return {
    days,
    hours,
    minutes,
    seconds,
    total: totalMs,
  }
}
