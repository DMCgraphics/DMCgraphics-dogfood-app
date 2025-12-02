"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Info, X } from "lucide-react"
import Link from "next/link"

const metricsConfig = [
  {
    id: "digestion",
    label: "Improved Digestion",
    value: "92%",
    qualifier: "of dogs improved in 30 days",
    tooltip: "Based on post-purchase surveys; N≥500; improvements defined as firmer stools/less gas/regularity.",
    sourceHref: "/methodology#digestion",
    testId: "metric-digestion",
  },
  {
    id: "testing",
    label: "Safety & Testing",
    value: "Lab tested",
    qualifier: "AAFCO approved recipes & salmonella tested",
    tooltip:
      "Our AAFCO approved recipes are lab tested to ensure proper ingredient ratios. Nutrient premix tested for salmonella.",
    sourceHref: "/methodology#testing",
    testId: "metric-testing",
  },
]

interface TooltipState {
  isOpen: boolean
  metricId: string | null
}

export function MetricsSection() {
  const [tooltip, setTooltip] = useState<TooltipState>({ isOpen: false, metricId: null })
  const [hasViewed, setHasViewed] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasViewed) {
            setHasViewed(true)
            trackMetricImpression()
          }
        })
      },
      { threshold: 0.5 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [hasViewed])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && tooltip.isOpen) {
        closeTooltip()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [tooltip.isOpen])

  const trackMetricImpression = () => {
    const sessionId = sessionStorage.getItem("session_id") || Date.now().toString()
    sessionStorage.setItem("session_id", sessionId)
    sessionStorage.setItem("metrics_viewed", "true")
    sessionStorage.setItem("metrics_view_time", Date.now().toString())

    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "metrics_impression", {
        metric_ids: metricsConfig.map((m) => m.id),
        session_id: sessionId,
        timestamp: Date.now(),
      })
    }
  }

  const trackTooltipOpen = (metricId: string) => {
    const sessionId = sessionStorage.getItem("session_id") || Date.now().toString()

    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "metric_tooltip_open", {
        metric_id: metricId,
        session_id: sessionId,
        has_viewed_metrics: sessionStorage.getItem("metrics_viewed") === "true",
      })
    }
  }

  const trackMethodologyClick = (metricId: string) => {
    const sessionId = sessionStorage.getItem("session_id") || Date.now().toString()

    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "methodology_click", {
        metric_id: metricId,
        session_id: sessionId,
        source: "tooltip",
      })
    }
  }

  const openTooltip = (metricId: string) => {
    setTooltip({ isOpen: true, metricId })
    trackTooltipOpen(metricId)

    setTimeout(() => {
      if (tooltipRef.current) {
        tooltipRef.current.focus()
      }
    }, 100)
  }

  const closeTooltip = () => {
    setTooltip({ isOpen: false, metricId: null })
  }

  const handleKeyDown = (e: React.KeyboardEvent, metricId: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      openTooltip(metricId)
    }
  }

  return (
    <section ref={sectionRef} className="section-padding bg-muted/30" aria-labelledby="metrics-heading">
      <div className="container">
        <div className="text-center space-y-4 mb-12">
          <h2 id="metrics-heading" className="font-serif text-3xl lg:text-4xl font-bold">
            Fresh food, fully explained.
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Transparency you can trust, backed by real results from thousands of dogs.
          </p>
        </div>

        <dl
          className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-6 max-w-4xl mx-auto"
          role="group"
          aria-label="Key performance metrics"
        >
          {metricsConfig.map((metric) => (
            <div key={metric.id} className="relative">
              <Card
                className="h-full hover:shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                data-testid={metric.testId}
              >
                <CardContent className="p-6 text-center space-y-3">
                  <div className="flex items-start justify-between">
                    <dt className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      {metric.label}
                    </dt>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-muted focus:ring-2 focus:ring-primary focus:ring-offset-1"
                      onClick={() => openTooltip(metric.id)}
                      onKeyDown={(e) => handleKeyDown(e, metric.id)}
                      aria-describedby={`tooltip-${metric.id}`}
                      aria-label={`More information about ${metric.label}`}
                      aria-expanded={tooltip.isOpen && tooltip.metricId === metric.id}
                    >
                      <Info className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>

                  <dd className="space-y-2">
                    <div className="text-3xl lg:text-4xl font-bold font-serif text-primary" aria-live="polite">
                      {metric.value}
                    </div>
                    <p className="text-sm text-muted-foreground">{metric.qualifier}</p>
                  </dd>
                </CardContent>
              </Card>

              {tooltip.isOpen && tooltip.metricId === metric.id && (
                <div
                  ref={tooltipRef}
                  id={`tooltip-${metric.id}`}
                  className="absolute top-full left-0 right-0 z-50 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={`tooltip-title-${metric.id}`}
                  tabIndex={-1}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 id={`tooltip-title-${metric.id}`} className="font-semibold text-sm">
                      Methodology
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 focus:ring-2 focus:ring-primary"
                      onClick={closeTooltip}
                      aria-label="Close methodology information"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{metric.tooltip}</p>
                  <Link
                    href={metric.sourceHref}
                    className="text-sm text-primary hover:underline font-medium focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded"
                    onClick={() => trackMethodologyClick(metric.id)}
                  >
                    See full methodology →
                  </Link>
                </div>
              )}
            </div>
          ))}
        </dl>

        <footer className="text-center mt-8">
          <p className="text-xs text-muted-foreground" role="contentinfo">
            Results are self-reported; not a substitute for veterinary care.
          </p>
        </footer>
      </div>

      {tooltip.isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/10"
          onClick={closeTooltip}
          onKeyDown={(e) => e.key === "Escape" && closeTooltip()}
          aria-hidden="true"
        />
      )}
    </section>
  )
}
