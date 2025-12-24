import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Custom Dog Meal Plan for Picky Eaters | Free Calculator - NouriPet",
  description:
    "Finally, fresh food your picky dog will love! Get personalized recommendations in 2 minutes. AI-powered nutrition based on your dog's needs. Try risk-free in Stamford CT!",
  keywords: "dog meal plan, custom dog food, dog food calculator, picky eater dog food, dog nutrition calculator, personalized dog food, Stamford CT",
  openGraph: {
    title: "Custom Dog Meal Plan for Picky Eaters | Free Calculator - NouriPet",
    description:
      "Get personalized fresh dog food recommendations in 2 minutes. Perfect for picky eaters and sensitive stomachs. AI-powered nutrition calculator.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Custom Dog Meal Plan for Picky Eaters - NouriPet",
    description:
      "Get personalized fresh dog food recommendations in 2 minutes. Perfect for picky eaters and sensitive stomachs.",
  },
}

export default function PlanBuilderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
