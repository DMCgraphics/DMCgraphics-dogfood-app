// Plan token utilities for guest plan management
export function getPlanToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("nouripet-plan-token")
}

export function setPlanToken(token: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem("nouripet-plan-token", token)
}

export function removePlanToken(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("nouripet-plan-token")
}

export function generatePlanToken(): string {
  return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
