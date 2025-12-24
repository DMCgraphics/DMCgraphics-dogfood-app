import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Subscribe to Fresh Dog Food Delivery CT | NouriPet Subscriptions",
  description:
    "Convenient fresh dog food subscriptions in Stamford & Fairfield County. Same-day local delivery. Perfect for picky eaters. Pause, skip, or cancel anytime!",
  keywords: "dog food subscription, fresh dog food delivery, dog food Stamford CT, dog food Fairfield County, local dog food delivery, fresh dog food near me",
  openGraph: {
    title: "Subscribe to Fresh Dog Food Delivery CT - NouriPet",
    description:
      "Convenient fresh dog food subscriptions with same-day local delivery in Stamford & Fairfield County. Perfect for picky eaters and sensitive stomachs.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fresh Dog Food Subscription CT - NouriPet",
    description:
      "Convenient fresh dog food subscriptions with same-day delivery. Perfect for picky eaters. Pause, skip, or cancel anytime!",
  },
}

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
