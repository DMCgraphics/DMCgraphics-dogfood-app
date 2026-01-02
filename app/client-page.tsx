"use client"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { PricingCalculator } from "@/components/pricing-calculator"
import { ComparisonSection } from "@/components/comparison-section"
import { MetricsSection } from "@/components/metrics-section"
import { SourcingSection } from "@/components/sourcing-section"
import { SocialProofSection } from "@/components/social-proof-section"
import { PrescriptionSupportCard } from "@/components/prescription-support-card"
import { PricingFAQSection } from "@/components/pricing-faq-section"
import { FAQSection } from "@/components/faq-section"
import { Footer } from "@/components/footer"
import { InstagramGrid } from "@/components/instagram-grid"

export default function ClientHomePage() {

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": "https://nouripet.net/#localbusiness",
        name: "NouriPet",
        description: "Fresh dog food delivery service in Stamford CT and Fairfield County. Perfect for picky eaters and sensitive stomachs.",
        url: "https://nouripet.net",
        telephone: "(203) 208-6186",
        email: "support@nouripet.net",
        logo: {
          "@type": "ImageObject",
          url: "https://nouripet.net/logo.png",
        },
        image: "https://nouripet.net/og-social.jpg",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Stamford",
          addressRegion: "CT",
          postalCode: "06901",
          addressCountry: "US",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: "41.0534",
          longitude: "-73.5387",
        },
        areaServed: [
          {
            "@type": "City",
            name: "Stamford",
            containedIn: "CT",
          },
          {
            "@type": "AdministrativeArea",
            name: "Fairfield County",
            containedIn: "CT",
          },
          {
            "@type": "AdministrativeArea",
            name: "Westchester County",
            containedIn: "NY",
          },
        ],
        servesCuisine: "Pet Food",
        priceRange: "$$",
        paymentAccepted: "Credit Card, Debit Card",
        openingHours: "Mo-Fr 09:00-18:00",
      },
      {
        "@type": "Organization",
        "@id": "https://nouripet.net/#organization",
        name: "NouriPet",
        url: "https://nouripet.net",
        logo: {
          "@type": "ImageObject",
          url: "https://nouripet.net/logo.png",
        },
        description: "Fresh dog food for picky eaters and sensitive stomachs with complete nutritional transparency",
        sameAs: [
          "https://www.instagram.com/nouripet",
          "https://www.facebook.com/nouripet",
        ],
      },
      {
        "@type": "Product",
        "@id": "https://nouripet.net/#product",
        name: "NouriPet Fresh Dog Food",
        description: "Personalized fresh dog food perfect for picky eaters and sensitive stomachs. Vet-formulated with complete nutritional transparency and AAFCO compliance.",
        brand: {
          "@id": "https://nouripet.net/#organization",
        },
        offers: {
          "@type": "Offer",
          availability: "https://schema.org/InStock",
          priceCurrency: "USD",
          availableDeliveryMethod: "https://schema.org/OnSitePickup",
        },
      },
      {
        "@type": "FAQPage",
        "@id": "https://nouripet.net/#faq",
        mainEntity: [
          {
            "@type": "Question",
            name: "How do you ensure nutritional completeness?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "All our recipes are formulated by veterinary nutritionists to meet AAFCO standards for complete and balanced nutrition. We provide detailed nutrient analysis and third-party testing results for every batch.",
            },
          },
          {
            "@type": "Question",
            name: "Can you make food for dogs with medical needs?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Not yet — we don't replace prescription diets. But we're partnering with veterinary nutritionists to expand into medical-friendly plans soon. If your dog has medical needs, please consult with your veterinarian about appropriate dietary management.",
            },
          },
          {
            "@type": "Question",
            name: "What makes NouriPet different from other fresh dog food companies?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "We focus on complete nutritional transparency with detailed ingredient sourcing, AAFCO compliance visualization, and precise portion calculations based on your dog's individual needs. Every recipe includes full nutrient breakdowns and sustainability scoring.",
            },
          },
          {
            "@type": "Question",
            name: "How do you calculate my dog's portions?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "We use scientifically-backed formulas including Resting Energy Requirements (RER) and Daily Energy Requirements (DER) based on your dog's weight, age, activity level, and body condition score. Our calculations follow veterinary nutrition guidelines.",
            },
          },
          {
            "@type": "Question",
            name: "Are your ingredients human-grade?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, all our ingredients meet human-grade standards and are sourced from trusted suppliers. We provide detailed sourcing information and sustainability scores for complete transparency about where your dog's food comes from.",
            },
          },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <Header />
      <main>
        <HeroSection />
        <PricingCalculator />
        <ComparisonSection />
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

        <section className="section-padding bg-white dark:bg-gray-950">
          <div className="container max-w-6xl">
            <InstagramGrid limit={6} showFollowButton={true} />
          </div>
        </section>

        <PricingFAQSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  )
}
