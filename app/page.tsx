import type { Metadata } from "next"
import ClientHomePage from "./client-page"

export const metadata: Metadata = {
  title: "NouriPet - Coming Soon | Fresh Dog Food",
  description:
    "We're preparing fresh, algorithm-guided meals for dogs. Full launch coming Fall 2025. Join our private beta.",
  openGraph: {
    title: "NouriPet - Coming Soon | Fresh Dog Food",
    description:
      "We're preparing fresh, algorithm-guided meals for dogs. Full launch coming Fall 2025. Join our private beta.",
    url: "https://nouripet.net",
    siteName: "NouriPet",
    images: [
      {
        url: "https://nouripet.net/og-social.jpg",
        width: 1200,
        height: 630,
        alt: "NouriPet - Coming Soon - Fresh, algorithm-guided meals for dogs",
      },
      {
        url: "https://nouripet.net/og-image.png",
        width: 1200,
        height: 630,
        alt: "NouriPet - Coming Soon - Fresh, algorithm-guided meals for dogs",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NouriPet - Coming Soon | Fresh Dog Food",
    description:
      "We're preparing fresh, algorithm-guided meals for dogs. Full launch coming Fall 2025. Join our private beta.",
    images: ["https://nouripet.net/og-social.jpg"],
  },
  alternates: {
    canonical: "/",
  },
}

export default function HomePage() {
  return <ClientHomePage />
}
