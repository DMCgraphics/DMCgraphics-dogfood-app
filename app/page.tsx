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
import Link from "next/link"

const SITE_PASSWORD = "Luigi2025!$"

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedAuth = localStorage.getItem("site_authenticated")
    if (storedAuth === "true") {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

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

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Access Required</CardTitle>
            <CardDescription>
              Enter the password to access the main site, or{" "}
              <Link href="/early-access" className="text-blue-600 hover:underline">
                join our early access list
              </Link>
            </CardDescription>
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
          </CardContent>
        </Card>
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
