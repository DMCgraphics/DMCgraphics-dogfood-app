"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Package, ArrowRight, Home } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/header"

export default function ShopSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simple loading state
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Processing your order...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-16 max-w-3xl">
        <div className="text-center mb-8">
          <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-xl text-muted-foreground">
            Thank you for your purchase
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              What happens next?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium">Order Confirmation</p>
                  <p className="text-sm text-muted-foreground">
                    You'll receive an email confirmation with your order details shortly
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium">Preparation</p>
                  <p className="text-sm text-muted-foreground">
                    We'll prepare your fresh food packs with care
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium">Free Local Delivery</p>
                  <p className="text-sm text-muted-foreground">
                    Your order will be delivered to the address you provided
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50 mb-6">
          <CardHeader>
            <CardTitle>Want to save on future orders?</CardTitle>
            <CardDescription>
              Create an account to access subscription plans, manage orders, and get exclusive perks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1">
                <Link href="/auth/signup">
                  Create Account
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/plan-builder">
                  View Subscription Plans
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="ghost" asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        {sessionId && (
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Order ID: {sessionId.slice(0, 20)}...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
