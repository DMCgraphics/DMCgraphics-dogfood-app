import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "About Us - NouriPet",
  description: "Learn about NouriPet's mission to provide personalized, veterinarian-approved nutrition for every dog.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Header component */}
      <Header />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-green-50 to-emerald-50 py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="secondary" className="mb-6 bg-green-100 text-green-800">
                Our Story
              </Badge>
              <h1 className="font-serif text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Fresh nutrition made simple for your dog
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                NouriPet started with a simple belief: every dog deserves fresh, balanced meals made from real
                ingredients. We're in our early phase, working with local pet parents to bring personalized nutrition to
                dogs everywhere.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">2025</div>
                  <div className="text-gray-600">Early Access Launched</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">Locally Sourced</div>
                  <div className="text-gray-600">Ingredients from trusted farms and suppliers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">Community First</div>
                  <div className="text-gray-600">Built with feedback from real pet parents</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Values Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="font-serif text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Our Mission & Values</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  We're committed to revolutionizing pet nutrition through science-backed, personalized meal plans that
                  support every dog's health journey.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="font-serif text-xl font-semibold mb-3">Science-First</h3>
                    <p className="text-gray-600">
                      Every recipe is formulated by veterinary nutritionists using the latest research.
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="font-serif text-xl font-semibold mb-3">Personalized</h3>
                    <p className="text-gray-600">
                      Tailored nutrition plans based on your dog's unique profile and health needs.
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"
                        />
                      </svg>
                    </div>
                    <h3 className="font-serif text-xl font-semibold mb-3">Transparent</h3>
                    <p className="text-gray-600">
                      Complete ingredient transparency with detailed nutritional breakdowns.
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="font-serif text-xl font-semibold mb-3">Sustainable</h3>
                    <p className="text-gray-600">Responsibly sourced ingredients with minimal environmental impact.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="bg-gray-50 py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="font-serif text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Expert Nutritional Formulation</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Our recipes are formulated by a board-certified veterinary nutritionist to ensure complete and balanced nutrition for your dog.
                </p>
              </div>

              <div className="flex justify-center">
                <Card className="text-center hover:shadow-lg transition-shadow max-w-md">
                  <CardContent className="p-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">JP</span>
                    </div>
                    <h3 className="font-serif text-2xl font-semibold mb-2">Dr. James Pendergast</h3>
                    <p className="text-blue-600 font-medium mb-4">Veterinary Nutritionist</p>
                    <p className="text-gray-600">
                      Dr. Pendergast formulated our recipes to meet AAFCO standards using whole food ingredients, minimizing the need for supplements while ensuring complete nutritional balance, including developing our custom vitamin and mineral premix.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Impact Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <Badge variant="secondary" className="mb-6 bg-green-100 text-green-800">
                    Our Impact
                  </Badge>
                  <h2 className="font-serif text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                    Transforming lives, one meal at a time
                  </h2>
                  <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                    Since our founding, we've helped thousands of dogs achieve better health outcomes through
                    personalized nutrition. From weight management to allergy relief, our tailored approach has made a
                    real difference in dogs' lives.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-gray-700">92% of dogs show improved energy levels within 30 days</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-gray-700">85% reduction in digestive issues for sensitive dogs</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-gray-700">78% of overweight dogs reach healthy weight goals</span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl p-8 text-center">
                    <img
                      src="/happy-healthy-dogs-eating.png"
                      alt="Happy dogs enjoying NouriPet meals"
                      className="w-full h-64 object-cover rounded-2xl mb-6"
                    />
                    <blockquote className="text-lg italic text-gray-700 mb-4">
                      "NouriPet transformed my senior dog's health. His energy is back, his coat is shinier, and his vet
                      is amazed by his improvement."
                    </blockquote>
                    <cite className="text-sm font-medium text-gray-600">— Jennifer M., NouriPet Customer</cite>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-green-600 to-emerald-600 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-white mb-6">
                Ready to transform your dog's nutrition?
              </h2>
              <p className="text-xl text-green-100 mb-8">
                Join thousands of pet parents who trust NouriPet for their dog's health and happiness.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-white text-green-600 hover:bg-gray-100">
                  <Link href="/plan-builder">Build Your Plan</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-green-600 bg-transparent"
                >
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer component */}
      <Footer />
    </div>
  )
}
