import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download } from "lucide-react"

export default function FeedingGuidePage() {
  const transitionSteps = [
    {
      days: "Days 1–2",
      percentage: 25,
      description: "Add a small amount of NouriPet to your pup's current food.",
    },
    {
      days: "Days 3–4",
      percentage: 50,
      description: "Mix 50% NouriPet with your pup's current food.",
    },
    {
      days: "Days 5–6",
      percentage: 75,
      description: "Mix 75% NouriPet with your pup's current food.",
    },
    {
      days: "Day 7+",
      percentage: 100,
      description: "Serve 100% NouriPet. Your pup is fully transitioned!",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-12">
        {/* Page Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="flex justify-center mb-6">
            <img src="/nouripet-logo.svg" alt="NouriPet Logo" className="h-16 w-16" />
          </div>
          <h1 className="font-manrope text-3xl lg:text-5xl font-bold text-primary">
            TRANSITIONING TO NOURIPET
          </h1>
          <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Ease your pup into their fresh new meals.
          </p>
        </div>

        {/* Download Button */}
        <div className="flex justify-center mb-12">
          <Button size="lg" asChild className="w-full md:w-auto inline-flex items-center gap-2">
            <a href="/np-feeding-guide.pdf" download="nouripet-feeding-guide.pdf">
              <Download className="h-5 w-5" />
              Download PDF Guide
            </a>
          </Button>
        </div>

        {/* Transition Steps */}
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {transitionSteps.map((step, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center space-y-6">
                    {/* Pie Chart */}
                    <div className="relative w-48 h-48">
                      <svg viewBox="0 0 200 200" className="w-full h-full">
                        {step.percentage === 100 ? (
                          // Full green circle for 100%
                          <circle cx="100" cy="100" r="80" fill="#22c55e" />
                        ) : (
                          <>
                            {/* Background circle - Current Food (brown) */}
                            <circle cx="100" cy="100" r="80" fill="#9b8b6f" />
                            {/* NouriPet portion (green) - overlaid as a pie slice */}
                            <path
                              d={(() => {
                                const percentage = step.percentage
                                const angle = (percentage / 100) * 360
                                const radians = (angle - 90) * (Math.PI / 180)
                                const x = 100 + 80 * Math.cos(radians)
                                const y = 100 + 80 * Math.sin(radians)
                                const largeArc = percentage > 50 ? 1 : 0
                                return `M 100 100 L 100 20 A 80 80 0 ${largeArc} 1 ${x} ${y} Z`
                              })()}
                              fill="#22c55e"
                            />
                          </>
                        )}
                      </svg>
                      {/* Percentage Label */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl font-bold text-white">{step.percentage}%</span>
                      </div>
                    </div>

                    {/* Step Info */}
                    <div className="text-center space-y-2">
                      <h3 className="font-manrope text-2xl font-bold text-primary">{step.days}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Legend */}
          <div className="flex justify-center items-center gap-8 mt-12">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#9b8b6f]" />
              <span className="text-sm font-medium">Current Food</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#22c55e]" />
              <span className="text-sm font-medium">NouriPet</span>
            </div>
          </div>
        </div>

        {/* Footer Tagline */}
        <div className="text-center mt-16 space-y-4">
          <div className="h-1 w-full max-w-4xl mx-auto bg-primary" />
          <p className="font-manrope text-2xl lg:text-3xl font-bold text-primary">
            Fresh. Local. Nourishing.
          </p>
          <p className="text-muted-foreground">
            nouripet.net • @nouripet
          </p>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12 space-y-4">
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Need personalized feeding recommendations? Use our meal plan builder to get customized portion sizes and schedules based on your dog's specific needs.
          </p>
          <Button asChild variant="outline" size="lg">
            <a href="/plan-builder">Build Your Dog's Plan</a>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  )
}
