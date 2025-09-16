import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { RERDERCalculator } from "@/components/calculators/rer-der-calculator"
import { PortionCalculator } from "@/components/calculators/portion-calculator"
import { EPADHACalculator } from "@/components/calculators/epa-dha-calculator"
import { NutrientAnalyzer } from "@/components/calculators/nutrient-analyzer"
import { Calculator, BookOpen } from "lucide-react"

export default function CalculatorsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-12">
        {/* Page Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calculator className="h-8 w-8 text-primary" />
            <h1 className="font-manrope text-3xl lg:text-4xl font-bold">Nutrition Calculators</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Understand the science behind your dog's nutrition with our transparent calculation tools. See exactly how
            we determine portions, energy needs, and supplement dosages.
          </p>
        </div>

        {/* Educational Note */}
        <div className="mb-12 p-6 bg-primary/5 rounded-2xl">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-primary mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Educational Tools</h3>
              <p className="text-sm text-muted-foreground">
                These calculators are designed to help you understand how we determine your dog's nutritional needs.
                While they provide scientifically-based estimates, always consult with your veterinarian for specific
                dietary recommendations, especially if your dog has health conditions.
              </p>
            </div>
          </div>
        </div>

        {/* Calculators Grid */}
        <div className="space-y-12">
          <RERDERCalculator />
          <PortionCalculator />
          <EPADHACalculator />
          <NutrientAnalyzer />
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-6 py-16 mt-16 bg-muted/30 rounded-3xl">
          <h2 className="font-manrope text-2xl lg:text-3xl font-bold">Ready for a personalized plan?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Our meal plan builder uses these same calculations to create a customized nutrition plan for your dog.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/plan-builder"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Build Your Dog's Plan
            </a>
            <a
              href="/recipes"
              className="inline-flex items-center justify-center px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
            >
              View Our Recipes
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
