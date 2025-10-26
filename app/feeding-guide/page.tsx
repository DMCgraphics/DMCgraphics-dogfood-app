import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, FileText } from "lucide-react"

export default function FeedingGuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-12">
        {/* Page Header */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="font-manrope text-3xl lg:text-4xl font-bold">Feeding Guide</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Download our comprehensive feeding guide to learn about proper portions, feeding schedules, and nutritional guidelines for your dog.
          </p>
        </div>

        {/* PDF Preview Card */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col items-center space-y-6">
                {/* PDF Icon */}
                <div className="rounded-full bg-primary/10 p-6">
                  <FileText className="h-16 w-16 text-primary" />
                </div>

                {/* PDF Info */}
                <div className="text-center space-y-2">
                  <h2 className="font-manrope text-2xl font-bold">NouriPet Feeding Guide</h2>
                  <p className="text-muted-foreground">
                    A complete guide to feeding your dog the right portions at the right times
                  </p>
                </div>

                {/* Download Button */}
                <Button size="lg" asChild className="flex items-center gap-2">
                  <a href="/np-feeding-guide.pdf" download="nouripet-feeding-guide.pdf">
                    <Download className="h-5 w-5" />
                    Download Feeding Guide (PDF)
                  </a>
                </Button>
              </div>

              {/* PDF Embed */}
              <div className="mt-8 border rounded-lg overflow-hidden">
                <iframe
                  src="/np-feeding-guide.pdf"
                  className="w-full h-[600px]"
                  title="NouriPet Feeding Guide"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12 space-y-4">
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Need personalized feeding recommendations? Use our meal plan builder to get customized portion sizes and schedules based on your dog's specific needs.
          </p>
          <Button asChild variant="outline">
            <a href="/plan-builder">Build Your Dog's Plan</a>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  )
}
