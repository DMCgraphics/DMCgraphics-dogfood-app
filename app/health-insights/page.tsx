"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HealthInsights } from "@/components/customer/health-insights"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function HealthInsightsPage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container py-8">
          <div className="space-y-6">
            <div>
              <h1 className="font-manrope text-2xl lg:text-3xl font-bold">Health Insights</h1>
              <p className="text-muted-foreground">
                Track your dog's health progress and get personalized recommendations
              </p>
            </div>

            <HealthInsights />
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  )
}
