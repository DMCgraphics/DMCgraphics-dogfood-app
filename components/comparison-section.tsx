"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, TrendingDown, Award } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const comparisonData = [
  {
    feature: "Price (Medium Dog)",
    nouripet: "$94/2 weeks",
    nouripetHighlight: true,
    national: "$120-150/2 weeks",
    kibble: "$60-80/2 weeks",
    homemade: "$80-120/2 weeks",
  },
  {
    feature: "AAFCO Certified",
    nouripet: true,
    national: true,
    kibble: true,
    homemade: false,
  },
  {
    feature: "Vet Nutritionist Formulated",
    nouripet: true,
    national: true,
    kibble: "varies",
    homemade: false,
  },
  {
    feature: "Fresh Ingredients",
    nouripet: true,
    national: true,
    kibble: false,
    homemade: true,
  },
  {
    feature: "Local Same-Day Delivery",
    nouripet: true,
    nouripetHighlight: true,
    national: false,
    kibble: false,
    homemade: false,
  },
  {
    feature: "Personalized Portions",
    nouripet: true,
    national: true,
    kibble: false,
    homemade: "manual",
  },
  {
    feature: "Ingredient Transparency",
    nouripet: "Full sourcing info",
    nouripetHighlight: true,
    national: "Basic",
    kibble: "Limited",
    homemade: "DIY",
  },
  {
    feature: "Cancel Anytime",
    nouripet: true,
    national: true,
    kibble: "N/A",
    homemade: "N/A",
  },
]

const savingsExamples = [
  {
    dogSize: "Small Dog (15 lbs)",
    nouripet: "$58",
    national: "$80-100",
    savings: "Up to $42",
    percentage: "35%",
  },
  {
    dogSize: "Medium Dog (35 lbs)",
    nouripet: "$94",
    national: "$120-150",
    savings: "Up to $56",
    percentage: "37%",
  },
  {
    dogSize: "Large Dog (70 lbs)",
    nouripet: "$138",
    national: "$180-220",
    savings: "Up to $82",
    percentage: "37%",
  },
]

export function ComparisonSection() {
  const renderValue = (value: any, isNouriPet = false, highlight = false) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className={`h-5 w-5 ${isNouriPet ? "text-primary" : "text-green-600"} mx-auto`} />
      ) : (
        <X className="h-5 w-5 text-muted-foreground mx-auto" />
      )
    }

    if (typeof value === "string") {
      return (
        <span className={`text-sm ${highlight ? "font-bold text-primary" : ""}`}>
          {value}
        </span>
      )
    }

    return <span className="text-sm text-muted-foreground">{value}</span>
  }

  return (
    <section className="section-padding bg-muted/30">
      <div className="container max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingDown className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h2 className="font-manrope text-2xl lg:text-3xl font-bold mb-4">
            How NouriPet Compares
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Premium fresh food nutrition at local prices. See how we stack up against national brands, kibble, and homemade meals.
          </p>
        </div>

        {/* Savings Highlight Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {savingsExamples.map((example, index) => (
            <Card key={index} className="relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                Save {example.percentage}
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{example.dogSize}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">NouriPet</span>
                  <span className="text-2xl font-bold text-primary">{example.nouripet}</span>
                </div>
                <div className="flex justify-between items-baseline text-sm">
                  <span className="text-muted-foreground">National Brands</span>
                  <span className="line-through text-muted-foreground">{example.national}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-green-600 font-semibold">
                    <Award className="h-4 w-4" />
                    <span>Save {example.savings} biweekly</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Comparison</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-2 font-semibold text-sm">Feature</th>
                  <th className="text-center py-4 px-2">
                    <div className="flex flex-col items-center gap-1">
                      <Badge className="bg-primary">NouriPet</Badge>
                    </div>
                  </th>
                  <th className="text-center py-4 px-2 text-sm font-medium text-muted-foreground">
                    National Fresh Food
                  </th>
                  <th className="text-center py-4 px-2 text-sm font-medium text-muted-foreground">
                    Premium Kibble
                  </th>
                  <th className="text-center py-4 px-2 text-sm font-medium text-muted-foreground">
                    Homemade
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr key={index} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-2 font-medium text-sm">{row.feature}</td>
                    <td className="py-4 px-2 text-center bg-primary/5">
                      {renderValue(row.nouripet, true, row.nouripetHighlight)}
                    </td>
                    <td className="py-4 px-2 text-center">{renderValue(row.national)}</td>
                    <td className="py-4 px-2 text-center">{renderValue(row.kibble)}</td>
                    <td className="py-4 px-2 text-center">{renderValue(row.homemade)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Key Differentiators */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                  <TrendingDown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Better Value</h3>
                  <p className="text-sm text-muted-foreground">
                    Save up to 37% vs national fresh food brands while getting the same premium nutrition and quality.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Local Advantage</h3>
                  <p className="text-sm text-muted-foreground">
                    Same-day delivery, fresher food, and personalized local service you won't get from national chains.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Full Transparency</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete ingredient sourcing, nutrition calculations, and AAFCO compliance data—not just marketing claims.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
