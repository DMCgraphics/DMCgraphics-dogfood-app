"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

function ErrorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get("error_description") || "The authentication link is invalid or has expired"

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
        <CardDescription>
          There was a problem with your authentication link
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="space-y-2">
          <Button
            className="w-full"
            onClick={() => router.push("/auth/forgot-password")}
          >
            Request New Password Reset
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/auth/login")}
          >
            Back to Login
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-16">
        <Suspense fallback={
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="py-8 text-center">
              Loading...
            </CardContent>
          </Card>
        }>
          <ErrorContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
