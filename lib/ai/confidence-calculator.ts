/**
 * Confidence Calculator
 *
 * Converts numeric confidence scores (0-100) into user-friendly
 * confidence levels with colors, emojis, and descriptions.
 */

export type ConfidenceLevel = 'very-high' | 'high' | 'moderate' | 'needs-more-info'

export interface ConfidenceResult {
  level: ConfidenceLevel
  percentage: number
  emoji: string
  color: string
  bgColor: string
  textColor: string
  label: string
  description: string
}

/**
 * Calculate confidence level from numeric score
 */
export function calculateConfidence(score: number): ConfidenceResult {
  // Clamp score between 0 and 100
  const percentage = Math.min(100, Math.max(0, score))

  if (percentage >= 85) {
    return {
      level: 'very-high',
      percentage,
      emoji: '✨',
      color: 'emerald',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
      textColor: 'text-emerald-700 dark:text-emerald-300',
      label: 'Very High Match',
      description: 'Excellent match based on comprehensive profile data',
    }
  } else if (percentage >= 70) {
    return {
      level: 'high',
      percentage,
      emoji: '👍',
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-300',
      label: 'High Match',
      description: 'Strong match with good profile information',
    }
  } else if (percentage >= 55) {
    return {
      level: 'moderate',
      percentage,
      emoji: '💡',
      color: 'amber',
      bgColor: 'bg-amber-50 dark:bg-amber-900/30',
      textColor: 'text-amber-700 dark:text-amber-300',
      label: 'Moderate Match',
      description: 'Good recommendation, but more data could help refine',
    }
  } else {
    return {
      level: 'needs-more-info',
      percentage,
      emoji: '🤔',
      color: 'slate',
      bgColor: 'bg-slate-50 dark:bg-slate-800/30',
      textColor: 'text-slate-700 dark:text-slate-300',
      label: 'Needs More Info',
      description: 'Limited data available - add more details for better recommendations',
    }
  }
}

/**
 * Get progress bar colors for confidence visualization
 */
export function getProgressBarColors(level: ConfidenceLevel): {
  filled: string
  unfilled: string
} {
  const colors = {
    'very-high': {
      filled: 'bg-emerald-500',
      unfilled: 'bg-emerald-100',
    },
    high: {
      filled: 'bg-blue-500',
      unfilled: 'bg-blue-100',
    },
    moderate: {
      filled: 'bg-amber-500',
      unfilled: 'bg-amber-100',
    },
    'needs-more-info': {
      filled: 'bg-slate-400',
      unfilled: 'bg-slate-100',
    },
  }

  return colors[level]
}

/**
 * Format confidence percentage for display
 */
export function formatConfidencePercentage(percentage: number): string {
  return `${Math.round(percentage)}%`
}

/**
 * Get badge color classes for confidence level
 */
export function getConfidenceBadgeColors(level: ConfidenceLevel): {
  bg: string
  text: string
  border: string
} {
  const colors = {
    'very-high': {
      bg: 'bg-emerald-100',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
    },
    high: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200',
    },
    moderate: {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-200',
    },
    'needs-more-info': {
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      border: 'border-slate-200',
    },
  }

  return colors[level]
}

/**
 * Check if confidence is sufficient to proceed
 */
export function isSufficientConfidence(score: number): boolean {
  return score >= 55 // Moderate or higher
}

/**
 * Get missing data suggestions based on low confidence
 */
export function getMissingDataSuggestions(
  score: number,
  hasBreed: boolean,
  hasBodyCondition: boolean,
  hasHealthGoals: boolean,
  hasAllergens: boolean
): string[] {
  const suggestions: string[] = []

  if (score < 70) {
    if (!hasBreed) {
      suggestions.push('Add breed information for breed-specific recommendations')
    }
    if (!hasBodyCondition) {
      suggestions.push('Add body condition score for weight management guidance')
    }
    if (!hasHealthGoals) {
      suggestions.push('Add health goals for targeted nutrition')
    }
    if (!hasAllergens) {
      suggestions.push('Specify any known allergens or sensitivities')
    }
  }

  return suggestions
}

/**
 * Calculate confidence improvement if missing data is added
 */
export function estimateConfidenceImprovements(currentScore: number): {
  withBreed: number
  withBodyCondition: number
  withHealthGoals: number
  withAllergens: number
} {
  return {
    withBreed: Math.min(100, currentScore + 8),
    withBodyCondition: Math.min(100, currentScore + 12),
    withHealthGoals: Math.min(100, currentScore + 10),
    withAllergens: Math.min(100, currentScore + 5),
  }
}

/**
 * Get confidence trend message
 */
export function getConfidenceTrendMessage(
  previousScore: number,
  currentScore: number,
  dogName: string
): string | null {
  const improvement = currentScore - previousScore

  if (improvement >= 15) {
    return `Great! ${dogName}'s recommendation confidence jumped by ${Math.round(improvement)}% with this new information.`
  } else if (improvement >= 5) {
    return `Nice! Adding this info improved ${dogName}'s match by ${Math.round(improvement)}%.`
  }

  return null
}
