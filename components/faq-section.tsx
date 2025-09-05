"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

const faqs = [
  {
    question: "How do you ensure nutritional completeness?",
    answer:
      "All our recipes are formulated by veterinary nutritionists to meet AAFCO standards for complete and balanced nutrition. We provide detailed nutrient analysis and third-party testing results for every batch.",
  },
  {
    question: "Can you make food for dogs with medical needs?",
    answer:
      "Not yet — we don't replace prescription diets. But we're partnering with veterinary nutritionists to expand into medical-friendly plans soon. If your dog has medical needs, please consult with your veterinarian about appropriate dietary management.",
  },
  {
    question: "What makes NouriPet different from other fresh dog food companies?",
    answer:
      "We focus on complete nutritional transparency with detailed ingredient sourcing, AAFCO compliance visualization, and precise portion calculations based on your dog's individual needs. Every recipe includes full nutrient breakdowns and sustainability scoring.",
  },
  {
    question: "How do you calculate my dog's portions?",
    answer:
      "We use scientifically-backed formulas including Resting Energy Requirements (RER) and Daily Energy Requirements (DER) based on your dog's weight, age, activity level, and body condition score. Our calculations follow veterinary nutrition guidelines.",
  },
  {
    question: "Are your ingredients human-grade?",
    answer:
      "Yes, all our ingredients meet human-grade standards and are sourced from trusted suppliers. We provide detailed sourcing information and sustainability scores for complete transparency about where your dog's food comes from.",
  },
]

export function FAQSection() {
  const [openItems, setOpenItems] = useState<string[]>([])

  const toggleItem = (value: string) => {
    setOpenItems((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
  }

  return (
    <section className="section-padding">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="font-manrope text-2xl lg:text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get answers to common questions about NouriPet's approach to dog nutrition and our commitment to
            transparency.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <Collapsible
                open={openItems.includes(index.toString())}
                onOpenChange={() => toggleItem(index.toString())}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-left text-lg font-semibold">{faq.question}</CardTitle>
                      <ChevronDown
                        className={`h-5 w-5 transition-transform ${
                          openItems.includes(index.toString()) ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
