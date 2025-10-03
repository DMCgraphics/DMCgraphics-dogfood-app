import type { Metadata } from "next"
import EarlyAccessClient from "./early-access-client"

export const metadata: Metadata = {
  title: "Sign Up for Early Access – NouriPet",
  description: "Be the first to try NouriPet's customized, vet‑informed dog meals. Join our early access program.",
  openGraph: {
    title: "Sign Up for Early Access – NouriPet",
    description: "Be the first to try NouriPet's customized, vet‑informed dog meals. Join our early access program.",
    url: "https://nouripet.net/early-access",
    siteName: "NouriPet",
    images: [
      {
        url: "https://nouripet.net/og-social.jpg?v=2",
        width: 1200,
        height: 630,
        alt: "NouriPet Early Access - Get personalized dog nutrition",
        type: "image/jpeg",
      },
      {
        url: "https://nouripet.net/og-social.jpg?v=2",
        width: 1200,
        height: 630,
        alt: "NouriPet Early Access - Get personalized dog nutrition",
        type: "image/jpeg",
        secureUrl: "https://nouripet.net/og-social.jpg?v=2",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign Up for Early Access – NouriPet",
    description: "Be the first to try NouriPet's customized, vet‑informed dog meals. Join our early access program.",
    images: ["https://nouripet.net/og-social.jpg?v=2"],
  },
  alternates: {
    canonical: "/early-access",
  },
  other: {
    "fb:app_id": "your-facebook-app-id", // Replace with actual Facebook App ID if available
    "og:image:secure_url": "https://nouripet.net/og-social.jpg?v=2",
    "og:image:type": "image/jpeg",
    "og:image:width": "1200",
    "og:image:height": "630",
  },
}

export default function EarlyAccessPage() {
  return <EarlyAccessClient />
}
