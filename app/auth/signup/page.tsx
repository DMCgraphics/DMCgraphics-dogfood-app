"use client"

import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SignupForm } from "@/components/auth/signup-form"

export default function SignupPage() {
  const router = useRouter()

  const handleSuccess = () => {
    // Redirect to plan builder for new users
    router.push("/plan-builder")
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-16">
        <SignupForm onSuccess={handleSuccess} onSwitchToLogin={() => router.push("/login")} />
      </main>
      <Footer />
    </div>
  )
}
