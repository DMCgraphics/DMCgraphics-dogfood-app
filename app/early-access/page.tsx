"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

const FORM_ENDPOINT = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT || "https://formspree.io/f/mandwgyb"

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function EarlyAccessPage() {
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    dogName: "",
    website: "", // honeypot
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)
  const [emailError, setEmailError] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (name === "email" && emailError) {
      setEmailError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowError(false)
    setEmailError("")

    if (formData.website.trim() !== "") {
      setShowSuccess(true)
      return
    }

    const email = formData.email.trim()
    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email.")
      return
    }

    setIsSubmitting(true)

    const payload = {
      email,
      firstName: formData.firstName.trim(),
      dogName: formData.dogName.trim(),
      source: "early-access-landing",
    }

    try {
      if (typeof window !== "undefined" && window.analytics?.track) {
        window.analytics.track("signup_submitted", { source: "early-access" })
      }

      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setShowSuccess(true)
        if (typeof window !== "undefined" && window.analytics?.track) {
          window.analytics.track("signup_succeeded", { source: "early-access" })
        }
      } else {
        setShowError(true)
        if (typeof window !== "undefined" && window.analytics?.track) {
          window.analytics.track("signup_failed", { source: "early-access", status: response.status })
        }
      }
    } catch (error) {
      setShowError(true)
      if (typeof window !== "undefined" && window.analytics?.track) {
        window.analytics.track("signup_failed", { source: "early-access", error: String(error) })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.title = "Sign Up for Early Access – NouriPet";
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
              metaDescription.setAttribute('content', 'Be the first to try NouriPet\\'s customized, vet‑informed dog meals.');
            }
          `,
        }}
      />

      <section className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mb-4">
          <div className="mx-auto mb-4 w-32 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">NouriPet</span>
          </div>
        </div>

        <h1 className="text-3xl font-semibold mb-3 font-sans">Get Early Access to Personalized Dog Nutrition</h1>

        <p className="text-base text-gray-600 mb-8 font-sans">
          Join the pack and be the first to try vet‑informed meals customized for your dog.
        </p>

        {!showSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              tabIndex={-1}
              autoComplete="off"
              className="absolute left-[-9999px]"
              aria-hidden="true"
            />

            <div className="text-left">
              <Label htmlFor="email" className="block text-sm font-medium mb-1 font-sans">
                Email<span aria-hidden="true">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                className={emailError ? "border-red-500" : ""}
              />
              {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
            </div>

            <div className="text-left">
              <Label htmlFor="firstName" className="block text-sm font-medium mb-1 font-sans">
                First name (optional)
              </Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange}
              />
            </div>

            <div className="text-left mb-6">
              <Label htmlFor="dogName" className="block text-sm font-medium mb-1 font-sans">
                Dog's name (optional)
              </Label>
              <Input id="dogName" name="dogName" type="text" value={formData.dogName} onChange={handleInputChange} />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl px-4 py-3 font-semibold font-sans"
            >
              {isSubmitting ? "Submitting…" : "Join Now"}
            </Button>

            <p className="text-xs text-gray-500 mt-3 font-sans">No spam. Unsubscribe anytime.</p>
          </form>
        ) : (
          <div className="mt-6">
            <p className="text-lg font-medium mb-2 font-sans">Thanks! You're on the list. 🐾</p>
            <p className="text-sm text-gray-600 font-sans">We'll email you early access details soon.</p>
          </div>
        )}

        {showError && (
          <div className="mt-6">
            <p className="text-sm text-red-600 font-sans">Something went wrong—please try again.</p>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-gray-200">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-800 underline font-sans">
            Already have access? Enter the main site
          </Link>
        </div>
      </section>
    </div>
  )
}
