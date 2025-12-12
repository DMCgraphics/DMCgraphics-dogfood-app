"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SignupForm } from "@/components/auth/signup-form"

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get("invite")
  const returnTo = searchParams.get("returnTo")

  const handleSuccess = (subscriptionId?: string) => {
    console.log("[v0] signup_success_redirect", {
      hasInvite: !!inviteToken,
      hasReturnTo: !!returnTo,
      subscriptionId
    })

    // Priority: returnTo > inviteToken with subscription > default (plan-builder)
    if (returnTo) {
      router.push(decodeURIComponent(returnTo))
    } else if (inviteToken && subscriptionId) {
      // Direct redirect to customization flow with subscription ID
      router.push(`/subscription/customize?id=${subscriptionId}`)
    } else if (inviteToken) {
      // Fallback if subscription ID is missing - try manage page
      console.warn("[v0] Invitation claimed but subscription ID not available")
      router.push("/subscription/manage")
    } else {
      router.push("/plan-builder")
    }
  }

  return (
    <SignupForm
      onSuccess={handleSuccess}
      onSwitchToLogin={() => router.push("/login")}
      inviteToken={inviteToken || undefined}
    />
  )
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-16">
        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <SignupContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
