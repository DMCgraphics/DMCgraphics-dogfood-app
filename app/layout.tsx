import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import ClientLayout from "./client"

export const metadata: Metadata = {
  metadataBase: new URL("https://nouripet.net"),
  title: {
    default: "NouriPet – Fresh Dog Food",
    template: "%s | NouriPet",
  },
  description: "Premium dog food with nutritional transparency, deep personalization, and a wellness ecosystem.",
  openGraph: {
    title: "NouriPet – Fresh Dog Food",
    description: "Premium dog food with nutritional transparency, deep personalization, and a wellness ecosystem.",
    url: "https://nouripet.net",
    siteName: "NouriPet",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "NouriPet" }],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "NouriPet – Fresh Dog Food",
    description: "Premium dog food with nutritional transparency, deep personalization, and a wellness ecosystem.",
    images: ["/og-image.png"],
  },
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <ClientLayout>{children}</ClientLayout>
}
