"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, DollarSign } from "lucide-react"
import { useState } from "react"

const pricingFaqs = [
  {
    question: "How much does NouriPet cost?",
    answer:
      "Pricing starts at $29/week for small dogs (5-20 lbs) and goes up to $87/week for XL dogs (91+ lbs). We offer biweekly delivery at $58-$174 every two weeks. Your exact price depends on your dog's weight, activity level, and selected recipes. Use our plan builder to get a personalized quote.",
  },
  {
    question: "Is there a minimum commitment or contract?",
    answer:
      "No contracts or commitments required. You can pause, skip, or cancel your subscription anytime through your account dashboard. We believe in earning your business every delivery, not locking you in.",
  },
  {
    question: "Do you offer a trial or money-back guarantee?",
    answer:
      "Yes! We offer a 100% satisfaction guarantee. If your dog doesn't love their first delivery, contact us within 7 days for a full refund. No questions asked. We're confident your dog will love fresh, personalized nutrition.",
  },
  {
    question: "What's included in the price?",
    answer:
      "Your subscription includes: fresh, AAFCO-balanced meals tailored to your dog's needs, free local delivery in Westchester NY and Fairfield CT, vacuum-sealed packaging for freshness, and full access to our customer support team. Add-ons like fish oil and probiotics are $10 each per 2 weeks.",
  },
  {
    question: "How does pricing compare to other fresh dog food brands?",
    answer:
      "NouriPet is competitively priced compared to national brands like Farmer's Dog and Ollie, but with the advantage of local, same-day delivery and personalized service. You save up to 50% compared to buying fresh food from pet stores, and you get vet-formulated nutrition instead of expensive kibble.",
  },
  {
    question: "Can I change my plan or skip deliveries?",
    answer:
      "Absolutely! You have full control over your subscription. Change recipes, adjust portions, add or remove supplements, skip weeks, or pause anytime. Just log into your dashboard or contact us. No fees for changes.",
  },
  {
    question: "Are there any discounts available?",
    answer:
      "We offer discounts for multi-dog households, referrals (get $20 off when you refer a friend), and occasional seasonal promotions. First-time customers often receive special introductory offers—check our homepage for current deals.",
  },
  {
    question: "How is delivery priced?",
    answer:
      "Delivery is always FREE for our local service area (Westchester County, NY and Fairfield County, CT). We deliver fresh food directly to your door every 2 weeks. No hidden fees, no delivery charges.",
  },
]

export function PricingFAQSection() {
  const [openItems, setOpenItems] = useState<string[]>(["0"]) // First item open by default

  const toggleItem = (value: string) => {
    setOpenItems((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
  }

  return (
    <section className="section-padding bg-muted/30">
      <div className="container">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h2 className="font-manrope text-2xl lg:text-3xl font-bold mb-4">Pricing & Plans</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Transparent pricing with no hidden fees. Get answers to your questions about costs, subscriptions, and value.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {pricingFaqs.map((faq, index) => (
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
                        className={`h-5 w-5 flex-shrink-0 transition-transform ${
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

        {/* CTA at bottom of pricing FAQ */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Still have questions? We're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/plan-builder"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Get Your Personalized Quote
            </a>
            <a
              href="mailto:support@nouripet.net"
              className="inline-flex items-center justify-center px-6 py-3 border border-border rounded-lg font-semibold hover:bg-muted/50 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
