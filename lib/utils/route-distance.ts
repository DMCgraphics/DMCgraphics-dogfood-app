/**
 * Route Distance & ETA Calculation Utilities
 *
 * Currently uses simple zipcode-based distance estimation.
 *
 * Future Enhancement: Integrate Google Maps Distance Matrix API for
 * accurate driving distances and real-time traffic-based ETAs.
 */

/**
 * Calculate approximate distance between two zipcodes
 * Uses numeric difference as a rough proxy for geographic distance
 *
 * Note: This is a simplified heuristic. Zipcodes that are numerically
 * close are generally geographically close, but this doesn't account for:
 * - Non-sequential zipcode assignment
 * - Natural barriers (rivers, mountains)
 * - Road networks
 *
 * @param zip1 - First zipcode
 * @param zip2 - Second zipcode
 * @returns Distance score (not miles, but proportional to distance)
 */
export function calculateZipcodeDistance(zip1: string, zip2: string): number {
  const num1 = parseInt(zip1.replace(/\D/g, '')) || 0
  const num2 = parseInt(zip2.replace(/\D/g, '')) || 0
  return Math.abs(num1 - num2)
}

/**
 * Estimate travel time based on zipcode distance
 * Assumes average speed of 15 mph in urban delivery zones
 *
 * @param distanceScore - Result from calculateZipcodeDistance
 * @returns Estimated minutes (rounded)
 */
export function estimateDeliveryTime(distanceScore: number): number {
  // Convert distance score to approximate minutes
  // Formula: (score * 0.001) * 60 / 15
  // This gives reasonable estimates for nearby zipcodes
  const minutes = (distanceScore * 0.001 * 60) / 15
  return Math.max(1, Math.round(minutes))
}

/**
 * Format distance for display
 * Shows either distance score or "Same area" for very close zipcodes
 *
 * @param distanceScore - Result from calculateZipcodeDistance
 * @returns Human-readable distance string
 */
export function formatDistance(distanceScore: number): string {
  if (distanceScore < 5) {
    return "Same area"
  }

  // Very rough approximation: score ~= miles * 1000
  // But we'll just show the score with "units" label for now
  const approxMiles = (distanceScore * 0.001).toFixed(1)
  return `~${approxMiles} mi`
}

/**
 * Format ETA for display
 *
 * @param minutes - Estimated minutes from estimateDeliveryTime
 * @returns Human-readable ETA string
 */
export function formatETA(minutes: number): string {
  if (minutes < 2) {
    return "< 2 min"
  }
  if (minutes > 60) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `~${hours}h ${mins}m` : `~${hours}h`
  }
  return `~${minutes} min`
}

/**
 * Calculate distance and ETA between two stops
 *
 * @param fromZip - Starting zipcode
 * @param toZip - Destination zipcode
 * @returns Object with distance and ETA information
 */
export function calculateStopDistance(fromZip: string, toZip: string) {
  const distanceScore = calculateZipcodeDistance(fromZip, toZip)
  const minutes = estimateDeliveryTime(distanceScore)

  return {
    distanceScore,
    distance: formatDistance(distanceScore),
    eta: formatETA(minutes),
    minutes
  }
}
