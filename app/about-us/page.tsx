import type { Metadata } from "next"
import AboutUsClientPage from "./AboutUsClientPage"

export const metadata: Metadata = {
  title: "About Us - NouriPet | Fresh Nutrition Made Simple",
  description:
    "Learn about NouriPet's mission to bring personalized, fresh dog nutrition to pet parents everywhere. Built with community feedback.",
  openGraph: {
    title: "About Us - NouriPet | Fresh Nutrition Made Simple",
    description:
      "Learn about NouriPet's mission to bring personalized, fresh dog nutrition to pet parents everywhere. Built with community feedback.",
    url: "https://nouripet.net/about-us",
    siteName: "NouriPet",
    images: [
      {
        url: "https://nouripet.net/og-image.png",
        width: 1200,
        height: 630,
        alt: "About NouriPet - Fresh nutrition made simple for your dog",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us - NouriPet | Fresh Nutrition Made Simple",
    description:
      "Learn about NouriPet's mission to bring personalized, fresh dog nutrition to pet parents everywhere. Built with community feedback.",
    images: ["https://nouripet.net/og-image.png"],
  },
  alternates: {
    canonical: "/about-us",
  },
}

export default function AboutUsPage() {
  return <AboutUsClientPage />
}
