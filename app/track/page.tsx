"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TrackingLookup } from "@/components/orders/tracking-lookup"

export default function TrackPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-16">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="font-manrope text-3xl lg:text-4xl font-bold mb-4">Track Your Delivery</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get real-time updates on your fresh dog food delivery. Enter your tracking number or order number below.
            </p>
          </div>

          <TrackingLookup />
        </div>
      </main>

      <Footer />
    </div>
  )
}
