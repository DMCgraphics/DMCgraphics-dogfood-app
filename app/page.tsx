import type { Metadata } from "next"
import ClientHomePage from "./client-page"

export const metadata: Metadata = {
  title: "Fresh Dog Food Delivery Stamford CT | Perfect for Picky Eaters - NouriPet",
  description:
    "Fresh dog food for picky eaters & sensitive stomachs. Local delivery in Stamford & Fairfield County. Vet-formulated, same-day delivery. Start your subscription today!",
  keywords: "fresh dog food delivery, dog food for picky eaters, dog food for sensitive stomach, Stamford CT, Fairfield County, local dog food delivery, fresh dog food subscription",
  openGraph: {
    title: "Fresh Dog Food Delivery Stamford CT | Perfect for Picky Eaters - NouriPet",
    description:
      "Fresh dog food for picky eaters & sensitive stomachs. Local delivery in Stamford & Fairfield County. Vet-formulated, same-day delivery available.",
    url: "https://nouripet.net",
    siteName: "NouriPet",
    images: [
      {
        url: "https://nouripet.net/og-social.jpg",
        width: 1200,
        height: 630,
        alt: "NouriPet - Fresh Dog Food for Picky Eaters in Stamford CT",
      },
      {
        url: "https://nouripet.net/og-image.png",
        width: 1200,
        height: 630,
        alt: "NouriPet - Fresh Dog Food for Picky Eaters",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fresh Dog Food for Picky Eaters | Stamford CT - NouriPet",
    description:
      "Fresh dog food for picky eaters & sensitive stomachs. Local delivery in Stamford & Fairfield County. Vet-formulated, same-day delivery available.",
    images: ["https://nouripet.net/og-social.jpg"],
  },
  alternates: {
    canonical: "/",
  },
}

export default function HomePage() {
  return <ClientHomePage />
}
