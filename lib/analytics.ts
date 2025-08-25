interface AnalyticsEvent {
  event: string
  properties: Record<string, any>
  timestamp?: number
}

interface PricingBasisRenderedEvent {
  event: "pricing_basis_rendered"
  properties: {
    recipeIds: string[]
    medical: boolean
    mealsPerDay: number
    kcalPer100g: number
    costPerDay: number
    dogId?: string
    sessionId?: string
  }
}

interface MealsPerDayChangedEvent {
  event: "meals_per_day_changed"
  properties: {
    from: number
    to: number
    costPerDayBefore: number
    costPerDayAfter: number
    priceDiff: number
    dogId?: string
    sessionId?: string
  }
}

interface PricingInvarianceViolationEvent {
  event: "pricing_invariance_violation"
  properties: {
    oldCost: number
    newCost: number
    diff: number
    recipeIds: string[]
    prescriptionDiet?: string | null
    mealsPerDay: number
    dogId?: string
    sessionId?: string
  }
}

interface ReviewPlanViewedEvent {
  event: "review_plan_viewed"
  properties: {
    planId?: string
    dogProfile: any
    selectedRecipes: string[]
    selectedRecipeId: string | null
    selectedPrescriptionDiet?: string | null
    mealsPerDay: number
    selectedAddOns: string[]
    sessionId?: string
  }
}

interface ProceedToCheckoutClickedEvent {
  event: "proceed_to_checkout_clicked"
  properties: {
    planId: string
    dogs: any[]
    recipes: string[]
    prescriptionDiet?: string | null
    mealsPerDay: number
    planType: string
    priceMonthly: number
    addOns: string[]
    sessionId?: string
  }
}

interface CheckoutCompletedEvent {
  event: "checkout_completed"
  properties: {
    orderId: string
    subscriptionId: string
    total: string
    paymentMethod: string
    planId: string
    sessionId?: string
  }
}

interface SubscriptionCreatedEvent {
  event: "subscription_created"
  properties: {
    subscriptionId: string
    orderId: string
    planId: string
    nextDeliveryDate: string
    sessionId?: string
  }
}

interface ConfirmationViewedEvent {
  event: "confirmation_viewed"
  properties: {
    orderId: string
    subscriptionId: string
    total: string
    sessionId?: string
  }
}

interface StepViewedEvent {
  event: "step_viewed"
  properties: {
    stepNumber: number
    stepTitle: string
    sessionId?: string
  }
}

type TrackedEvent =
  | PricingBasisRenderedEvent
  | MealsPerDayChangedEvent
  | PricingInvarianceViolationEvent
  | ReviewPlanViewedEvent
  | ProceedToCheckoutClickedEvent
  | CheckoutCompletedEvent
  | SubscriptionCreatedEvent
  | ConfirmationViewedEvent
  | StepViewedEvent

class Analytics {
  private sessionId: string
  private isDev: boolean

  constructor() {
    this.sessionId = this.generateSessionId()
    this.isDev = process.env.NODE_ENV === "development"
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  track(event: TrackedEvent): void {
    const enrichedEvent: AnalyticsEvent = {
      ...event,
      properties: {
        ...event.properties,
        sessionId: this.sessionId,
        timestamp: Date.now(),
      },
    }

    // Console logging for development
    if (this.isDev) {
      console.log(`[Analytics] ${event.event}:`, enrichedEvent.properties)
    }

    // Send to analytics service (placeholder)
    this.sendToAnalytics(enrichedEvent)

    // Send critical events to Sentry
    if (event.event === "pricing_invariance_violation") {
      this.sendToSentry(enrichedEvent)
    }
  }

  private sendToAnalytics(event: AnalyticsEvent): void {
    // In production, this would send to your analytics service
    // For now, we'll just store in localStorage for debugging
    try {
      const stored = localStorage.getItem("nouripet_analytics") || "[]"
      const events = JSON.parse(stored)
      events.push(event)

      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100)
      }

      localStorage.setItem("nouripet_analytics", JSON.stringify(events))
    } catch (error) {
      console.warn("[Analytics] Failed to store event:", error)
    }
  }

  private sendToSentry(event: AnalyticsEvent): void {
    // Send to Sentry if available
    if (typeof window !== "undefined" && (window as any).Sentry) {
      ;(window as any).Sentry.captureEvent({
        message: event.event,
        level: "error",
        extra: event.properties,
        tags: {
          component: "pricing",
          type: "invariance_violation",
        },
      })
    }

    // Also log as error in development
    if (this.isDev) {
      console.error(`[Sentry] ${event.event}:`, event.properties)
    }
  }

  // Helper methods for specific events
  trackPricingBasisRendered(properties: Omit<PricingBasisRenderedEvent["properties"], "sessionId">): void {
    this.track({
      event: "pricing_basis_rendered",
      properties,
    })
  }

  trackMealsPerDayChanged(properties: Omit<MealsPerDayChangedEvent["properties"], "sessionId">): void {
    this.track({
      event: "meals_per_day_changed",
      properties,
    })
  }

  trackPricingInvarianceViolation(properties: Omit<PricingInvarianceViolationEvent["properties"], "sessionId">): void {
    this.track({
      event: "pricing_invariance_violation",
      properties,
    })
  }

  reviewPlanViewed(properties: Omit<ReviewPlanViewedEvent["properties"], "sessionId">): void {
    this.track({
      event: "review_plan_viewed",
      properties,
    })
  }

  proceedToCheckoutClicked(properties: Omit<ProceedToCheckoutClickedEvent["properties"], "sessionId">): void {
    this.track({
      event: "proceed_to_checkout_clicked",
      properties,
    })
  }

  checkoutCompleted(properties: Omit<CheckoutCompletedEvent["properties"], "sessionId">): void {
    this.track({
      event: "checkout_completed",
      properties,
    })
  }

  subscriptionCreated(properties: Omit<SubscriptionCreatedEvent["properties"], "sessionId">): void {
    this.track({
      event: "subscription_created",
      properties,
    })
  }

  confirmationViewed(properties: Omit<ConfirmationViewedEvent["properties"], "sessionId">): void {
    this.track({
      event: "confirmation_viewed",
      properties,
    })
  }

  stepViewed(stepNumber: number, stepTitle: string): void {
    this.track({
      event: "step_viewed",
      properties: {
        stepNumber,
        stepTitle,
      },
    })
  }

  // Dashboard check helper - get recent pricing violations
  getRecentPricingViolations(hours = 24): AnalyticsEvent[] {
    try {
      const stored = localStorage.getItem("nouripet_analytics") || "[]"
      const events = JSON.parse(stored)
      const cutoff = Date.now() - hours * 60 * 60 * 1000

      return events.filter(
        (event: AnalyticsEvent) =>
          event.event === "pricing_invariance_violation" && (event.properties.timestamp || 0) > cutoff,
      )
    } catch (error) {
      console.warn("[Analytics] Failed to get recent violations:", error)
      return []
    }
  }
}

// Singleton instance
export const analytics = new Analytics()

// Helper function to check violation rate
export function checkPricingViolationRate(): { rate: number; total: number; violations: number } {
  try {
    const stored = localStorage.getItem("nouripet_analytics") || "[]"
    const events = JSON.parse(stored)
    const cutoff = Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours

    const recentEvents = events.filter((event: AnalyticsEvent) => (event.properties.timestamp || 0) > cutoff)

    const mealsChangedEvents = recentEvents.filter((event: AnalyticsEvent) => event.event === "meals_per_day_changed")

    const violationEvents = recentEvents.filter(
      (event: AnalyticsEvent) => event.event === "pricing_invariance_violation",
    )

    const rate = mealsChangedEvents.length > 0 ? violationEvents.length / mealsChangedEvents.length : 0

    return {
      rate,
      total: mealsChangedEvents.length,
      violations: violationEvents.length,
    }
  } catch (error) {
    console.warn("[Analytics] Failed to check violation rate:", error)
    return { rate: 0, total: 0, violations: 0 }
  }
}
