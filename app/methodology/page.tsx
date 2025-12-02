import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Shield, BarChart3, Users, Calendar } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Our Methodology | NouriPet - How We Measure Dog Health Results",
  description:
    "Detailed methodology behind our 92% digestion improvement rate and lab testing protocols. AAFCO approved recipes tested at Midwest Labs for ingredient accuracy and safety.",
  keywords: "dog food testing methodology, AAFCO compliance, pet food safety, dog nutrition research, digestion improvement",
  openGraph: {
    title: "Our Methodology | NouriPet - How We Measure Dog Health Results",
    description:
      "Detailed methodology behind our 92% digestion improvement rate and lab testing protocols. AAFCO approved recipes tested at Midwest Labs.",
    type: "article",
    url: "https://nouripet.net/methodology",
    siteName: "NouriPet",
    images: [
      {
        url: "https://nouripet.net/og-image.png",
        width: 1200,
        height: 630,
        alt: "NouriPet Methodology - How We Measure Dog Health Results",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Methodology | NouriPet - How We Measure Dog Health Results",
    description:
      "Detailed methodology behind our 92% digestion improvement rate and lab testing protocols. AAFCO approved recipes tested at Midwest Labs.",
    images: ["https://nouripet.net/og-image.png"],
  },
  alternates: {
    canonical: "/methodology",
  },
}

export default function MethodologyPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "NouriPet Methodology: How We Measure Dog Health Results",
    description:
      "Detailed methodology behind our 92% digestion improvement rate and lab testing protocols. AAFCO approved recipes tested at Midwest Labs for ingredient accuracy and safety.",
    author: {
      "@type": "Organization",
      name: "NouriPet",
    },
    publisher: {
      "@type": "Organization",
      name: "NouriPet",
      logo: {
        "@type": "ImageObject",
        url: "https://nouripet.net/logo.png",
      },
    },
    datePublished: "2024-01-01",
    dateModified: "2024-01-01",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "https://nouripet.net/methodology",
    },
  }

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <Header />
      <main className="section-padding">
        <div className="container max-w-4xl">
          {/* Page Header */}
          <div className="text-center space-y-4 mb-16">
            <h1 className="font-serif text-4xl lg:text-5xl font-bold">Our Methodology</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Transparency in how we measure and report our impact on dog health and nutrition.
            </p>
          </div>

          {/* Digestion Methodology */}
          <section id="digestion" className="mb-16 scroll-mt-24">
            <Card className="overflow-hidden">
              <CardHeader className="bg-green-50 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-serif">Improved Digestion: 92%</CardTitle>
                    <p className="text-muted-foreground">of dogs improved in 30 days</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">Sample Size</p>
                      <p className="text-sm text-muted-foreground">N = 1,247 dogs</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">Time Window</p>
                      <p className="text-sm text-muted-foreground">30-day follow-up</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">Response Rate</p>
                      <p className="text-sm text-muted-foreground">78% completion</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Methodology</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Post-purchase surveys sent to customers 30 days after their first delivery. Participants reported on
                    three key digestive health indicators compared to their dog's baseline before switching to NouriPet.
                  </p>

                  <div className="space-y-3">
                    <h4 className="font-medium">Improvement Criteria</h4>
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Stool Quality
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Firmer, more formed stools (Bristol Stool Scale improvement)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Gas Reduction
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Decreased flatulence frequency and odor intensity
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Regularity
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          More consistent bowel movement timing and frequency
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Calculation:</strong> Dogs showing improvement in at least 2 of 3 criteria were counted as
                      "improved." 1,147 of 1,247 respondents (92%) met this threshold.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Testing Methodology */}
          <section id="testing" className="mb-16 scroll-mt-24">
            <Card className="overflow-hidden">
              <CardHeader className="bg-blue-50 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-serif">Safety & Testing: Lab Tested</CardTitle>
                    <p className="text-muted-foreground">AAFCO approved recipes & salmonella tested</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Pathogen Testing</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Salmonella (Nutrient Premix)</span>
                        <Badge variant="secondary" className="text-xs">
                          Lab Tested
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Recipe Analysis</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Ingredient ratios</span>
                        <Badge variant="secondary" className="text-xs">
                          Lab Tested
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Nutritional profile</span>
                        <Badge variant="secondary" className="text-xs">
                          AAFCO Approved
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Testing Protocol</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Our AAFCO approved recipes undergo third-party laboratory testing at Midwest Labs to ensure proper ingredient ratios.
                    Nutrient premix is tested for salmonella. Nutritional profiles are formulated to meet or exceed AAFCO Adult Maintenance standards.
                  </p>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Testing Partner:</strong> Midwest Labs (ISO 17025 accredited laboratory)
                      <br />
                      <strong>Recipe Testing:</strong> AAFCO approved recipes lab tested for proper ingredient ratios
                      <br />
                      <strong>Pathogen Testing:</strong> Nutrient premix tested for salmonella
                      <br />
                      <strong>Compliance:</strong> AAFCO Adult Maintenance nutritional adequacy standards
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Disclaimer */}
          <div className="text-center py-8 border-t">
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              All data collection follows privacy guidelines and customer consent protocols. Results are self-reported
              and not a substitute for veterinary care. Individual results may vary based on dog breed, age, health
              status, and other factors.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
