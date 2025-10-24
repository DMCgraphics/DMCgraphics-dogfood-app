"use client"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { MetricsSection } from "@/components/metrics-section"
import { SourcingSection } from "@/components/sourcing-section"
import { SocialProofSection } from "@/components/social-proof-section"
import { PrescriptionSupportCard } from "@/components/prescription-support-card"
import { FAQSection } from "@/components/faq-section"
import { Footer } from "@/components/footer"

export default function ClientHomePage() {

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
