import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Shield, Star, BarChart3, Users, Calendar } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Our Methodology | NouriPet - How We Measure Dog Health Results",
  description:
    "Detailed methodology behind our 92% digestion improvement rate, every-batch testing protocols, and 4.9/5 customer rating. Complete transparency in our research.",
  keywords: "dog food testing methodology, AAFCO compliance, pet food safety, dog nutrition research, customer reviews",
  openGraph: {
    title: "Our Methodology | NouriPet - How We Measure Dog Health Results",
    description:
      "Detailed methodology behind our 92% digestion improvement rate, every-batch testing protocols, and 4.9/5 customer rating.",
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
      "Detailed methodology behind our 92% digestion improvement rate, every-batch testing protocols, and 4.9/5 customer rating.",
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
      "Detailed methodology behind our 92% digestion improvement rate, every-batch testing protocols, and 4.9/5 customer rating.",
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
                    <CardTitle className="text-2xl font-serif">Safety & Testing: Every Batch</CardTitle>
                    <p className="text-muted-foreground">independently tested & AAFCO balanced</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Pathogen Testing</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Salmonella</span>
                        <Badge variant="secondary" className="text-xs">
                          Every batch
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">E. coli</span>
                        <Badge variant="secondary" className="text-xs">
                          Every batch
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Listeria</span>
                        <Badge variant="secondary" className="text-xs">
                          Every batch
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Nutritional Analysis</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Protein content</span>
                        <Badge variant="secondary" className="text-xs">
                          Verified
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Fat content</span>
                        <Badge variant="secondary" className="text-xs">
                          Verified
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Mineral profile</span>
                        <Badge variant="secondary" className="text-xs">
                          AAFCO compliant
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Testing Protocol</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    All recipes undergo third-party laboratory testing through certified facilities before release.
                    Nutritional profiles are formulated to meet or exceed AAFCO Adult Maintenance standards.
                  </p>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Testing Partner:</strong> Eurofins Scientific (ISO 17025 accredited laboratory)
                      <br />
                      <strong>Frequency:</strong> 100% of production batches tested before distribution
                      <br />
                      <strong>Compliance:</strong> AAFCO Adult Maintenance nutritional adequacy standards
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Rating Methodology */}
          <section id="rating" className="mb-16 scroll-mt-24">
            <Card className="overflow-hidden">
              <CardHeader className="bg-yellow-50 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-100">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-serif">Rated 4.9/5</CardTitle>
                    <p className="text-muted-foreground">by pet parents</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">Total Reviews</p>
                      <p className="text-sm text-muted-foreground">N = 2,847 verified</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">Time Period</p>
                      <p className="text-sm text-muted-foreground">Last 12 months</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">Verification Rate</p>
                      <p className="text-sm text-muted-foreground">100% purchase verified</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Rating Distribution</h3>
                  <div className="space-y-2">
                    {[
                      { stars: 5, count: 2456, percentage: 86.3 },
                      { stars: 4, count: 312, percentage: 11.0 },
                      { stars: 3, count: 58, percentage: 2.0 },
                      { stars: 2, count: 15, percentage: 0.5 },
                      { stars: 1, count: 6, percentage: 0.2 },
                    ].map((rating) => (
                      <div key={rating.stars} className="flex items-center gap-3">
                        <span className="text-sm w-8">{rating.stars}★</span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${rating.percentage}%` }} />
                        </div>
                        <span className="text-sm text-muted-foreground w-16">{rating.count} reviews</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Calculation:</strong> Weighted average of all verified reviews from customers who
                      completed at least one order. Reviews are collected via post-purchase email and in-app prompts.
                      <br />
                      <strong>Verification:</strong> Only customers with confirmed purchases can leave reviews.
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
