import type React from "react"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { Manrope } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
})

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
})

export const metadata: Metadata = {
  title: "NouriPet - Fresh food, fully explained.",
  description: "Premium dog food with nutritional transparency, deep personalization, and a wellness ecosystem.",
  generator: "v0.app",
  openGraph: {
    title: "NouriPet - Fresh food, fully explained.",
    description: "Premium dog food with nutritional transparency, deep personalization, and a wellness ecosystem.",
    url: "https://nouripet.net",
    siteName: "NouriPet",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NouriPet - Premium dog food with fresh ingredients",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NouriPet - Fresh food, fully explained.",
    description: "Premium dog food with nutritional transparency, deep personalization, and a wellness ecosystem.",
    images: ["/og-image.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${manrope.variable} antialiased`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
