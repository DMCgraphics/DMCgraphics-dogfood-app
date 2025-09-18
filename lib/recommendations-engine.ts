export type Recommendation = {
  id: string
  type: "nutrition" | "health" | "portion" | "supplement"
  title: string
  description: string
  action: string
  priority: "high" | "medium" | "low"
  reason: string
}

export interface DogData {
  id: string
  name: string
  age?: number
  breed?: string
  weight?: number
  target_weight?: number
  activity_level?: string
  medical_conditions?: string[]
  breed_size?: "small" | "medium" | "large"
}

export interface WeightLog {
  date: string
  weight: number
}

export interface StoolLog {
  date: string
  score: number
}

export interface PlanData {
  id: string
  dog_id: string
  plan_data?: {
    weightGoal?: "lose" | "maintain" | "gain"
    kcalPerDay?: number
    mealsPerDay?: number
    recipe?: string
  }
  updated_at: string
}

export function buildRecommendations({ 
  dog, 
  weights, 
  stools, 
  plan 
}: {
  dog: DogData
  weights: WeightLog[]
  stools: StoolLog[]
  plan: PlanData | null
}): Recommendation[] {
  const recs: Recommendation[] = []
  const age = dog.age ?? null
  const breedSize = dog.breed_size ?? null
  const goal = plan?.plan_data?.weightGoal ?? "maintain"
  const kcalPerDay = plan?.plan_data?.kcalPerDay ?? null
  const mealsPerDay = plan?.plan_data?.mealsPerDay ?? 2

  // Helper functions
  const pctChange30d = (() => {
    if (!weights || weights.length < 2) return 0
    const last = weights[weights.length - 1].weight
    const cutoff = new Date(Date.now() - 30 * 864e5)
    const firstIdx = weights.findIndex(w => new Date(w.date) >= cutoff)
    const base = firstIdx >= 0 ? weights[firstIdx].weight : weights[0].weight
    return base ? ((last - base) / base) * 100 : 0
  })()

  const medianStool = (() => {
    if (!stools?.length) return null
    const s = stools.map(s => s.score).sort((a, b) => a - b)
    const mid = Math.floor(s.length / 2)
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
  })()

  const hasRecentStoolData = stools && stools.length > 0 && 
    stools.some(s => new Date(s.date) >= new Date(Date.now() - 14 * 864e5))

  const hasRecentWeightData = weights && weights.length > 0 && 
    weights.some(w => new Date(w.date) >= new Date(Date.now() - 14 * 864e5))

  // 1) Weight trend - portion down
  if (pctChange30d >= 5 && goal !== "gain") {
    recs.push({
      id: "portion-down",
      type: "portion",
      title: "Consider reducing daily portions",
      description: "Trend shows weight gain over the past month.",
      action: "Adjust portions",
      priority: "medium",
      reason: `Weight change ≈ +${pctChange30d.toFixed(1)}% in ~30 days.`,
    })
  }

  // 2) Weight trend - portion up
  if (pctChange30d <= -5 && goal !== "lose") {
    recs.push({
      id: "portion-up",
      type: "portion",
      title: "Consider increasing daily portions",
      description: "Trend shows weight loss over the past month.",
      action: "Adjust portions",
      priority: "medium",
      reason: `Weight change ≈ ${pctChange30d.toFixed(1)}% in ~30 days.`,
    })
  }

  // 3) Stool consistency - fiber tweak
  if (medianStool !== null && medianStool <= 2 && hasRecentStoolData) {
    recs.push({
      id: "stool-firm",
      type: "nutrition",
      title: "Add fiber or split meals",
      description: "Recent logs indicate firm stools.",
      action: "See recipe tips",
      priority: "medium",
      reason: `Median stool ≈ ${medianStool}.`,
    })
  }

  // 4) Stool soft - reduce fat / add binder
  if (medianStool !== null && medianStool >= 4 && hasRecentStoolData) {
    recs.push({
      id: "stool-soft",
      type: "nutrition",
      title: "Try lower-fat recipe or add soluble fiber",
      description: "Softer stools in recent logs.",
      action: "See recipe tips",
      priority: "medium",
      reason: `Median stool ≈ ${medianStool}.`,
    })
  }

  // 5) Age-based joint support
  const largeBreedEarly = breedSize === "large" && age && age >= 3
  if ((age && age >= 4) || largeBreedEarly) {
    recs.push({
      id: "joint-support",
      type: "supplement",
      title: "Add joint support supplement",
      description: "Preventative support for joints and mobility.",
      action: "Add joint blend",
      priority: "low",
      reason: `Age ${age}${largeBreedEarly ? ", large breed" : ""}.`,
    })
  }

  // 6) Activity mismatch
  if (dog.activity_level === "high" && kcalPerDay && kcalPerDay < 1000) {
    recs.push({
      id: "activity-mismatch",
      type: "portion",
      title: "Consider increasing portions for high activity",
      description: "High activity level may require more calories.",
      action: "Adjust portions",
      priority: "low",
      reason: "High activity level with current calorie intake.",
    })
  }

  // 7) Medical flag (low-fat)
  const hasPancreatitis = dog.medical_conditions?.some(condition => 
    condition.toLowerCase().includes('pancreatitis')
  )
  if (hasPancreatitis) {
    recs.push({
      id: "medical-low-fat",
      type: "nutrition",
      title: "Maintain low-fat diet",
      description: "Keep current low-fat recipe for pancreatitis management.",
      action: "Review recipe",
      priority: "high",
      reason: "Pancreatitis requires low-fat diet.",
    })
  }

  // 8) Rapid change guardrail
  if (Math.abs(pctChange30d) >= 10) {
    recs.push({
      id: "vet-advisory",
      type: "health",
      title: "Noticeable weight change — consider a vet check",
      description: "Large changes can have underlying causes.",
      action: "Find local vet",
      priority: "high",
      reason: `Weight change ≈ ${pctChange30d.toFixed(1)}% in ~30 days.`,
    })
  }

  // 9) No data nudge
  if (!hasRecentStoolData || !hasRecentWeightData) {
    recs.push({
      id: "log-nudge",
      type: "health",
      title: "Keep logs for better insights",
      description: "Add stool and weight entries to keep plans optimized.",
      action: "Log entries",
      priority: "low",
      reason: "Insufficient recent data.",
    })
  }

  // Sort by priority (high first, then medium, then low)
  return recs.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
}
