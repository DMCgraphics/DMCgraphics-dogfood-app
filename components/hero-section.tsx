"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Leaf, Stethoscope, Ban } from "lucide-react"
import Link from "next/link"
import { trackHeroCTAClick, initializeAnalytics } from "@/lib/analytics-utils"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { DogSelectionModal } from "@/components/modals/dog-selection-modal"
import { SubscriptionManagementModal } from "@/components/modals/subscription-management-modal"
import { useAuth } from "@/contexts/auth-context"

export function HeroSection() {
  const { user } = useAuth()
  const [hasExistingPlan, setHasExistingPlan] = useState(false)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showDogSelectionModal, setShowDogSelectionModal] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  useEffect(() => {
    initializeAnalytics()
    checkForExistingPlan()
  }, [])

  const checkForExistingPlan = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: subscriptions } = await supabase
          .from("subscriptions")
          .select("id, status")
          .eq("user_id", user.id)
          .in("status", ["active", "trialing", "past_due"])

        if (subscriptions && subscriptions.length > 0) {
          setHasActiveSubscription(true)
          setHasExistingPlan(false) // Don't show plan building options if they have active subscription
        } else {
          const { data: plans } = await supabase
            .from("plans")
            .select(`
              id,
              status,
              completed_steps,
              total_steps,
              subscriptions (
                id,
                status
              )
            `)
            .eq("user_id", user.id)
            .limit(1)

          if (plans && plans.length > 0) {
            const plan = plans[0]
            if (plan.status === "checkout" || (plan.completed_steps === plan.total_steps && plan.status === "saved")) {
              setHasExistingPlan(true) // Will show "Resume Building Plan" to go to checkout
            } else {
              setHasExistingPlan(true) // Will show "Resume Building Plan" to continue building
            }
          } else {
            // Fallback: check if user has any dogs (legacy check)
            const { data: dogs } = await supabase.from("dogs").select("id").eq("user_id", user.id).limit(1)
            setHasExistingPlan(dogs && dogs.length > 0)
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error checking for existing plan:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlanBuilderClick = () => {
    trackHeroCTAClick("build_plan")
    if (user) {
      if (hasActiveSubscription) {
        setShowSubscriptionModal(true)
      } else {
        setShowDogSelectionModal(true)
      }
    }
  }

  const handleLearnMoreClick = () => {
    trackHeroCTAClick("learn_more")
  }

  const handleDogSelection = (selectedDog: any) => {
    if (selectedDog) {
      // Pre-fill plan builder with existing dog data
      localStorage.setItem("nouripet-selected-dog", JSON.stringify(selectedDog))
    } else {
      // Clear any existing dog selection for new dog
      localStorage.removeItem("nouripet-selected-dog")
    }
    // Navigate to plan builder
    window.location.href = "/plan-builder"
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
              {user ? (
                <Button size="lg" className="text-lg px-8" onClick={handlePlanBuilderClick}>
                  {loading
                    ? "Build Your Dog's Plan"
                    : hasActiveSubscription
                      ? "Manage Subscription"
                      : hasExistingPlan
                        ? "Resume Building Plan"
                        : "Build Your Dog's Plan"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Button asChild size="lg" className="text-lg px-8" onClick={handlePlanBuilderClick}>
                  <Link href="/plan-builder">
                    Build Your Dog's Plan
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
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
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Leaf className="h-5 w-5 text-primary" />
                  <div className="font-serif text-2xl font-bold text-primary">100%</div>
                </div>
                <div className="text-sm text-muted-foreground">Fresh, Local Ingredients</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  <div className="font-serif text-2xl font-bold text-primary">Vet-Approved</div>
                </div>
                <div className="text-sm text-muted-foreground">AAFCO Balanced</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Ban className="h-5 w-5 text-primary" />
                  <div className="font-serif text-2xl font-bold text-primary">Zero</div>
                </div>
                <div className="text-sm text-muted-foreground">Artificial Preservatives</div>
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

      <DogSelectionModal
        open={showDogSelectionModal}
        onOpenChange={setShowDogSelectionModal}
        onSelectDog={handleDogSelection}
      />

      <SubscriptionManagementModal open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal} />
    </section>
  )
}
