"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LoyaltyRewards } from "@/components/customer/loyalty-rewards"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function RewardsPage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container py-8">
          <div className="space-y-6">
            <div>
              <h1 className="font-manrope text-2xl lg:text-3xl font-bold">Rewards & Loyalty</h1>
              <p className="text-muted-foreground">Earn points and unlock exclusive benefits</p>
            </div>

            <LoyaltyRewards />
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  )
}
