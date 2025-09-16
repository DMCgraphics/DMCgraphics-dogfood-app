import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign Up for Early Access – NouriPet",
  description: "Be the first to try NouriPet's customized, vet‑informed dog meals.",
  openGraph: {
    title: "Sign Up for Early Access – NouriPet",
    description: "Be the first to try NouriPet's customized, vet‑informed dog meals.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign Up for Early Access – NouriPet",
    description: "Be the first to try NouriPet's customized, vet‑informed dog meals.",
  },
}

export default function EarlyAccessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
