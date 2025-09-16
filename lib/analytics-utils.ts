export const trackHeroCTAClick = (ctaType: string) => {
  const sessionId = sessionStorage.getItem("session_id") || Date.now().toString()
  const hasViewedMetrics = sessionStorage.getItem("metrics_viewed") === "true"
  const metricsViewTime = sessionStorage.getItem("metrics_view_time")

  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "hero_cta_click", {
      cta_type: ctaType,
      session_id: sessionId,
      has_viewed_metrics: hasViewedMetrics,
      metrics_view_time: metricsViewTime,
      time_since_metrics: metricsViewTime ? Date.now() - Number.parseInt(metricsViewTime) : null,
    })
  }
}

export const initializeAnalytics = () => {
  // Set session ID if not exists
  if (!sessionStorage.getItem("session_id")) {
    sessionStorage.setItem("session_id", Date.now().toString())
  }
}
