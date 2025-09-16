"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { MetricsSection } from "@/components/metrics-section"
import { SourcingSection } from "@/components/sourcing-section"
import { SocialProofSection } from "@/components/social-proof-section"
import { PrescriptionSupportCard } from "@/components/prescription-support-card"
import { FAQSection } from "@/components/faq-section"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingAnimation } from "@/components/loading-animation"
import { SimpleNavigation } from "@/components/simple-navigation"
import Link from "next/link"

const SITE_PASSWORD = "Luigi2025!$"

export default function ClientHomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true)

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === SITE_PASSWORD) {
      localStorage.setItem("site_authenticated", "true")
      setIsAuthenticated(true)
      setError("")
    } else {
      setError("Incorrect password")
    }
  }

  useEffect(() => {
    const storedAuth = localStorage.getItem("site_authenticated")
    if (storedAuth === "true") {
      setIsAuthenticated(true)
    }

    const loadingTimer = setTimeout(() => {
      setShowLoadingAnimation(false)
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(loadingTimer)
  }, [])

  if (showLoadingAnimation) {
    return <LoadingAnimation />
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SimpleNavigation currentPage="coming-soon" />

        <div className="flex flex-col items-center justify-center px-4 py-16">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <img src="/nouripet-logo.svg" alt="NouriPet Logo" className="h-12 w-12" />
              <span className="font-serif text-3xl font-bold text-black">NouriPet</span>
            </div>

            <div className="mb-6">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Coming Soon</h1>
              <p className="text-lg text-gray-600 max-w-md mx-auto">
                We're preparing fresh, algorithm-guided meals for dogs. Full launch coming Fall 2025.
              </p>
            </div>
          </div>

          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Private Beta
                </Badge>
              </div>
              <CardTitle className="text-2xl">Access Required</CardTitle>
              <CardDescription>Enter the password to access the main site</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={error ? "border-red-500" : ""}
                  />
                  {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
                </div>
                <Button type="submit" className="w-full">
                  Access Site
                </Button>
              </form>

              <div className="text-center mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Don't have the password?{" "}
                  <Link href="/early-access" className="text-blue-600 hover:underline font-medium">
                    Join the waitlist →
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <footer className="mt-12 text-center">
            <div className="flex justify-center space-x-6">
              <a
                href="https://www.instagram.com/nouripet/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.073-1.689-.073-4.949 0-3.204.013-3.583.072-4.948.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <span className="sr-only">Instagram</span>
              </a>
            </div>
            <p className="text-xs text-gray-400 mt-2">© 2025 NouriPet. All rights reserved.</p>
          </footer>
        </div>
      </div>
    )
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://nouripet.com/#organization",
        name: "NouriPet",
        url: "https://nouripet.com",
        logo: {
          "@type": "ImageObject",
          url: "https://nouripet.com/logo.png",
        },
        description: "Fresh, personalized dog food with complete nutritional transparency",
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          bestRating: "5",
          worstRating: "1",
          ratingCount: "2847",
          reviewCount: "2847",
        },
      },
      {
        "@type": "Product",
        "@id": "https://nouripet.com/#product",
        name: "NouriPet Fresh Dog Food",
        description: "Personalized fresh dog food with complete nutritional transparency and AAFCO compliance",
        brand: {
          "@id": "https://nouripet.com/#organization",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          bestRating: "5",
          worstRating: "1",
          ratingCount: "2847",
          reviewCount: "2847",
        },
        offers: {
          "@type": "Offer",
          availability: "https://schema.org/InStock",
          priceCurrency: "USD",
        },
      },
    ],
  }

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <Header />
      <main>
        <HeroSection />
        <MetricsSection />

        <section className="section-padding bg-muted/30">
          <div className="container">
            <div className="max-w-2xl mx-auto">
              <PrescriptionSupportCard />
            </div>
          </div>
        </section>

        <SourcingSection />
        <SocialProofSection />

        <FAQSection />
      </main>
      <Footer />
    </div>
  )
}
