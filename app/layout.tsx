import type React from "react"
import { Suspense } from "react"
import type { Metadata } from "next"
import Script from "next/script"
import "./globals.css"
import { Inter, Manrope } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { CartProvider } from "@/contexts/cart-context"
import { Toaster } from "@/components/ui/toaster"
import { AIChatFAB } from "@/components/ai-chat-fab"
import { PromoModalProvider } from "@/components/promo-modal-provider"
import { MetaPixel } from "@/components/meta-pixel"
import { ExitIntentProvider } from "@/components/exit-intent-provider"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://nouripet.net"),
  title: {
    default: "NouriPet – Fresh Dog Food",
    template: "%s | NouriPet",
  },
  description: "Premium dog food with nutritional transparency, deep personalization, and a wellness ecosystem.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "NouriPet – Fresh Dog Food",
    description: "Premium dog food with nutritional transparency, deep personalization, and a wellness ecosystem.",
    url: "https://nouripet.net",
    siteName: "NouriPet",
    images: [
      {
        url: "/og-social.jpg",
        width: 1200,
        height: 630,
        alt: "Adorable puppy sitting next to fresh dog food ingredients including sweet potato, spinach, rice, and chicken - NouriPet Fresh Dog Food",
        type: "image/jpeg",
      },
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NouriPet Fresh Dog Food - Premium nutrition for your dog",
        type: "image/png",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "NouriPet – Fresh Dog Food",
    description: "Premium dog food with nutritional transparency, deep personalization, and a wellness ecosystem.",
    images: ["/og-social.jpg"],
  },
  other: {
    "fb:app_id": "nouripet",
    "og:image:secure_url": "https://nouripet.net/og-social.jpg",
    "og:image:type": "image/jpeg",
    "og:image:width": "1200",
    "og:image:height": "630",
  },
  alternates: {
    canonical: "/",
  },
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} antialiased`}>
      <body>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-SN1ZK2MEE5" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-SN1ZK2MEE5');
          `}
        </Script>
        <Suspense fallback={null}>
          <MetaPixel />
        </Suspense>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <CartProvider>
              <ExitIntentProvider>
                {children}
                <Toaster />
                <AIChatFAB />
                <PromoModalProvider />
              </ExitIntentProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
