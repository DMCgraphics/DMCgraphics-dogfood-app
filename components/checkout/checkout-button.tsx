"use client"

import { Button } from "@/components/ui/button"
import { CreditCard } from "lucide-react"
import { useState } from "react"

interface CheckoutButtonProps {
  planId: string
  total: number
}

export default function CheckoutButton({ planId, total }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan_id: planId }),
      })

      if (!response.ok) {
        throw new Error("Checkout failed")
      }

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("No checkout URL received")
      }
    } catch (error) {
      console.error("Checkout error:", error)
      alert("There was an error processing your checkout. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={isLoading}
      className="w-full bg-[#635bff] hover:bg-[#5a52e8] text-white"
      size="lg"
    >
      <CreditCard className="h-4 w-4 mr-2" />
      {isLoading ? "Processing..." : `Pay with Stripe - $${total.toFixed(2)}`}
    </Button>
  )
}
