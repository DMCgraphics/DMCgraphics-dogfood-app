import type { Metadata } from "next"
import ClientHomePage from "./client-page"

export const metadata: Metadata = {
  title: "NouriPet | Fresh, Personalized Dog Food Delivery",
  description:
    "Fresh, algorithm-guided meals for dogs with complete nutritional transparency. Personalized meal plans delivered to Westchester County, NY and Fairfield County, CT.",
  openGraph: {
    title: "NouriPet | Fresh, Personalized Dog Food Delivery",
    description:
      "Fresh, algorithm-guided meals for dogs with complete nutritional transparency. Personalized meal plans delivered to your door.",
    url: "https://nouripet.net",
    siteName: "NouriPet",
    images: [
      {
        url: "https://nouripet.net/og-social.jpg",
        width: 1200,
        height: 630,
        alt: "NouriPet - Fresh, algorithm-guided meals for dogs",
      },
      {
        url: "https://nouripet.net/og-image.png",
        width: 1200,
        height: 630,
        alt: "NouriPet - Fresh, algorithm-guided meals for dogs",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NouriPet | Fresh, Personalized Dog Food Delivery",
    description:
      "Fresh, algorithm-guided meals for dogs with complete nutritional transparency. Personalized meal plans delivered to your door.",
    images: ["https://nouripet.net/og-social.jpg"],
  },
  alternates: {
    canonical: "/",
  },
}

export default function HomePage() {
  return <ClientHomePage />
}
