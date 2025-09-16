"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Wishlist } from "@/components/customer/wishlist"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function WishlistPage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container py-8">
          <div className="space-y-6">
            <div>
              <h1 className="font-manrope text-2xl lg:text-3xl font-bold">My Wishlist</h1>
              <p className="text-muted-foreground">Save recipes and products you'd like to try</p>
            </div>

            <Wishlist />
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  )
}
