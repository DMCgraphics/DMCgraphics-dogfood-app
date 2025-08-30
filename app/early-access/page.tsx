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
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NouriPet Early Access - Get personalized dog nutrition",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign Up for Early Access – NouriPet",
    description: "Be the first to try NouriPet's customized, vet‑informed dog meals. Join our early access program.",
    images: ["/og-image.png"],
  },
}

export default function EarlyAccessPage() {
  return <EarlyAccessClient />
}
