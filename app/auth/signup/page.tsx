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

  const handleSuccess = () => {
    // If there's an invitation, redirect to a success page
    // Otherwise, redirect to plan builder for new users
    if (inviteToken) {
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
