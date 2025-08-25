"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { trackHeroCTAClick, initializeAnalytics } from "@/lib/analytics-utils"
import { useEffect } from "react"

export function HeroSection() {
  useEffect(() => {
    initializeAnalytics()
  }, [])

  const handlePlanBuilderClick = () => {
    trackHeroCTAClick("build_plan")
  }

  const handleLearnMoreClick = () => {
    trackHeroCTAClick("learn_more")
  }

  return (
    <section className="relative section-padding overflow-hidden">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="font-serif text-4xl lg:text-6xl font-bold tracking-tight">
                Fresh food, <span className="text-primary">fully explained.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                Build a plan your vet would love. More than "human-grade": balanced to AAFCO, with transparent label
                math.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="text-lg px-8" onClick={handlePlanBuilderClick}>
                <Link href="/plan-builder">
                  Build Your Dog's Plan
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 bg-transparent"
                onClick={handleLearnMoreClick}
              >
                <Link href="/recipes">Learn More</Link>
              </Button>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div className="text-center">
                <div className="font-serif text-2xl font-bold text-primary">10k+</div>
                <div className="text-sm text-muted-foreground">Happy Dogs</div>
              </div>
              <div className="text-center">
                <div className="font-serif text-2xl font-bold text-primary">98%</div>
                <div className="text-sm text-muted-foreground">Vet Approved</div>
              </div>
              <div className="text-center">
                <div className="font-serif text-2xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Transparent</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 p-8">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-08-16%20at%2010.01.13%E2%80%AFPM-ugxXyFlGSBnNz3PAfB1j8Q21r6wqvK.png"
                alt="Fresh natural ingredients including salmon, vegetables, and wholesome foods for premium dog nutrition"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-card border rounded-2xl p-4 shadow-lg">
              <div className="text-sm font-medium">Daily Nutrition</div>
              <div className="text-2xl font-bold text-primary">100%</div>
              <div className="text-xs text-muted-foreground">AAFCO Complete</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
