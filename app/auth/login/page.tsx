"use client"

import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LoginForm } from "@/components/auth/login-form"
import { ApiStatus } from "@/components/auth/api-status"

export default function LoginPage() {
  const router = useRouter()

  const handleSuccess = () => {
    // Redirect to dashboard or previous page
    const returnUrl = new URLSearchParams(window.location.search).get("returnUrl")
    router.push(returnUrl || "/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-16">
        <ApiStatus />
        <LoginForm onSuccess={handleSuccess} onSwitchToSignup={() => router.push("/register")} />
      </main>
      <Footer />
    </div>
  )
}
