"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle2, Sparkles, Heart, Brain } from "lucide-react"

export default function RafflePage() {
  const [dogName, setDogName] = useState("")
  const [email, setEmail] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [subscribeToUpdates, setSubscribeToUpdates] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/raffle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dogName,
          email,
          zipCode,
          subscribeToUpdates,
          utmSource: "harborpoint_event",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit entry")
      }

      setIsSuccess(true)
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-2xl border-2 border-green-500">
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">You're In!</h1>
              <p className="text-lg text-gray-600">
                Winner will be announced via email after the event.
              </p>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500">
                Check your inbox for your exclusive early-access discount on your first personalized meal plan!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Harbor Point Event
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Enter the NouriPet Raffle
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-green-600">
            Win a Week of Fresh Meals!
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Harbor Point's fresh dog food company, powered by vet expertise and smart personalization.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left Column - Form */}
          <Card className="shadow-xl border-2">
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="dogName" className="text-sm font-medium text-gray-700">
                    Dog's Name <span className="text-gray-400">(optional)</span>
                  </label>
                  <Input
                    id="dogName"
                    type="text"
                    placeholder="Max"
                    value={dogName}
                    onChange={(e) => setDogName(e.target.value)}
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="zipCode" className="text-sm font-medium text-gray-700">
                    ZIP Code <span className="text-gray-400">(optional)</span>
                  </label>
                  <Input
                    id="zipCode"
                    type="text"
                    placeholder="06850"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    maxLength={5}
                    className="text-lg"
                  />
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Checkbox
                    id="subscribe"
                    checked={subscribeToUpdates}
                    onCheckedChange={(checked) => setSubscribeToUpdates(checked === true)}
                  />
                  <label htmlFor="subscribe" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                    Send me NouriPet updates and exclusive local offers.
                  </label>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSubmitting ? "Submitting..." : "Enter to Win"}
                </Button>

                {/* Incentive */}
                <div className="pt-4 border-t text-center">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    💌 <strong>Everyone who enters</strong> also gets an exclusive early-access discount on their first plan.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Right Column - Visual & Info */}
          <div className="space-y-6">
            {/* Brand Visual */}
            <Card className="shadow-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
              <CardContent className="p-8 text-center space-y-4">
                <div className="text-6xl">🐕</div>
                <p className="text-lg font-medium text-gray-800 italic">
                  Freshly made in Connecticut.<br />
                  Founded in Harbor Point.
                </p>
              </CardContent>
            </Card>

            {/* Brand Differentiators */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 text-center">Why NouriPet?</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm border">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Fresh, Local Ingredients</h4>
                    <p className="text-sm text-gray-600">Made fresh in Connecticut with quality ingredients</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm border">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Vet Nutritionist Guidance</h4>
                    <p className="text-sm text-gray-600">Expert-approved nutrition for every life stage</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm border">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Personalized Meal Plans with AI</h4>
                    <p className="text-sm text-gray-600">Custom portions tailored to your dog's needs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
