"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AddressInput } from "@/components/ui/address-input"
import { LoadingAnimation } from "@/components/loading-animation"
import { SimpleNavigation } from "@/components/simple-navigation"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"

const FORM_ENDPOINT = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT || "https://formspree.io/f/mandwgyb"

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function EarlyAccessClient() {
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    address: "", // Added address field
    dogName: "",
    dogAge: "",
    dogWeight: "",
    dogBreed: "",
    mobilePhone: "",
    medicalConditions: "",
    website: "", // honeypot
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setShowLoadingAnimation(false)
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(loadingTimer)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (name === "email" && emailError) {
      setEmailError("")
    }
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleAddressChange = (value: string) => {
    setFormData((prev) => ({ ...prev, address: value }))
    if (validationErrors.address) {
      setValidationErrors((prev) => ({ ...prev, address: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowError(false)
    setEmailError("")
    setValidationErrors({})

    const isMobile =
      typeof window !== "undefined" &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    console.log(
      "[v0] Form submission - Mobile:",
      isMobile,
      "User Agent:",
      typeof window !== "undefined" ? navigator.userAgent : "N/A",
    )

    if (formData.website.trim() !== "") {
      setShowSuccess(true)
      return
    }

    const email = formData.email.trim()
    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email.")
      return
    }

    const errors: Record<string, string> = {}
    if (!formData.fullName.trim()) {
      errors.fullName = "First and last name is required."
    }
    if (!formData.address.trim()) {
      errors.address = "Address is required."
    }
    if (!formData.dogName.trim()) {
      errors.dogName = "Dog's name is required."
    }
    if (!formData.dogAge.trim()) {
      errors.dogAge = "Dog's age is required."
    }
    if (!formData.dogWeight.trim()) {
      errors.dogWeight = "Dog's weight is required."
    }
    if (!formData.dogBreed.trim()) {
      errors.dogBreed = "Dog's breed is required."
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setIsSubmitting(true)

    const payload = {
      email,
      firstName: formData.fullName.trim(),
      fullName: formData.fullName.trim(),
      address: formData.address.trim(),
      dogName: formData.dogName.trim(),
      dogAge: formData.dogAge.trim(),
      dogWeight: formData.dogWeight.trim(),
      dogBreed: formData.dogBreed.trim(),
      mobilePhone: formData.mobilePhone.trim(),
      medicalConditions: formData.medicalConditions.trim(),
      source: "early-access-landing",
      _replyto: email,
      _subject: "New Early Access Signup - NouriPet",
      _format: "plain",
      _language: "en",
      _origin: typeof window !== "undefined" ? window.location.origin : "https://nouripet.net",
      _device: isMobile ? "mobile" : "desktop",
      _userAgent: typeof window !== "undefined" ? navigator.userAgent : "unknown",
    }

    console.log("[v0] Form payload:", payload)

    try {
      if (typeof window !== "undefined" && window.analytics?.track) {
        window.analytics.track("signup_submitted", { source: "early-access" })
      }

      const currentOrigin = typeof window !== "undefined" ? window.location.origin : "https://nouripet.net"
      const currentUrl = typeof window !== "undefined" ? window.location.href : "https://nouripet.net/early-access"

      const headers: Record<string, string> = {
        Accept: "application/json",
        "Content-Type": "application/json",
      }

      console.log("[v0] Request headers:", headers)
      console.log("[v0] Request URL:", FORM_ENDPOINT)

      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        mode: "cors",
        credentials: "omit",
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        console.log("[v0] Form submission successful")

        await supabase
          .from("early_access_signups")
          .insert([
            {
              email,
              full_name: formData.fullName.trim(),
              address: formData.address.trim(),
              dog_name: formData.dogName.trim(),
              dog_age: formData.dogAge.trim(),
              dog_weight: formData.dogWeight.trim(),
              dog_breed: formData.dogBreed.trim(),
              mobile_phone: formData.mobilePhone.trim(),
              medical_conditions: formData.medicalConditions.trim(),
              source: "early-access-landing",
            },
          ])
          .then(() => {})
          .catch(() => {})

        setShowSuccess(true)
        if (typeof window !== "undefined" && window.analytics?.track) {
          window.analytics.track("signup_succeeded", { source: "early-access" })
        }
      } else {
        const errorData = await response.json().catch(() => null)
        console.log("[v0] Form submission failed:", response.status, errorData)

        if (errorData?.error) {
          if (errorData.error.includes("Unauthorized domain")) {
            console.error("[v0] Formspree domain authorization error:", errorData.error)
            setShowError(true)
          } else if (errorData.error.includes("CORS")) {
            console.error("[v0] CORS error:", errorData.error)
            setShowError(true)
          } else {
            console.error("[v0] Other Formspree error:", errorData.error)
            setShowError(true)
          }
        } else {
          console.error("[v0] Unknown error, status:", response.status)
          setShowError(true)
        }

        if (typeof window !== "undefined" && window.analytics?.track) {
          window.analytics.track("signup_failed", {
            source: "early-access",
            status: response.status,
            error: errorData?.error || "unknown",
            device: isMobile ? "mobile" : "desktop",
          })
        }
      }
    } catch (error) {
      console.error("[v0] Network error:", error)
      setShowError(true)
      if (typeof window !== "undefined" && window.analytics?.track) {
        window.analytics.track("signup_failed", {
          source: "early-access",
          error: String(error),
          device: isMobile ? "mobile" : "desktop",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showLoadingAnimation) {
    return <LoadingAnimation />
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <SimpleNavigation currentPage="early-access" />

      <section className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mb-4">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src="/nouripet-logo.svg" alt="NouriPet Logo" className="h-12 w-12" />
            <span className="font-serif text-2xl font-bold text-black">NouriPet</span>
          </div>
        </div>

        <h1 className="text-3xl font-semibold mb-3 font-sans">Get Early Access to Personalized Dog Nutrition</h1>

        <p className="text-base text-gray-600 mb-8 font-sans">
          Join the pack and be the first to try vet‑informed meals customized for your dog.
        </p>

        <div className="mb-8">
          <Link
            href="/about-us"
            className="inline-block px-8 py-3 rounded-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold text-sm transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl bg-[length:200%_100%] animate-gradient-shift"
          >
            Learn About Our Mission
          </Link>
        </div>

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
              <Label htmlFor="fullName" className="block text-sm font-medium mb-1 font-sans">
                First and Last Name<span aria-hidden="true">*</span>
              </Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="John Smith"
                className={validationErrors.fullName ? "border-red-500" : ""}
              />
              {validationErrors.fullName && <p className="mt-1 text-sm text-red-600">{validationErrors.fullName}</p>}
            </div>

            <div className="text-left">
              <Label htmlFor="address" className="block text-sm font-medium mb-1 font-sans">
                Address<span aria-hidden="true">*</span>
              </Label>
              <AddressInput
                id="address"
                value={formData.address}
                onChange={handleAddressChange}
                placeholder="123 Main St, City, State 12345"
                className={validationErrors.address ? "border-red-500" : ""}
                required
              />
              {validationErrors.address && <p className="mt-1 text-sm text-red-600">{validationErrors.address}</p>}
            </div>

            <div className="text-left">
              <Label htmlFor="dogName" className="block text-sm font-medium mb-1 font-sans">
                Dog's Name<span aria-hidden="true">*</span>
              </Label>
              <Input
                id="dogName"
                name="dogName"
                type="text"
                required
                value={formData.dogName}
                onChange={handleInputChange}
                placeholder="Buddy"
                className={validationErrors.dogName ? "border-red-500" : ""}
              />
              {validationErrors.dogName && <p className="mt-1 text-sm text-red-600">{validationErrors.dogName}</p>}
            </div>

            <div className="text-left">
              <Label htmlFor="dogAge" className="block text-sm font-medium mb-1 font-sans">
                Dog's Age<span aria-hidden="true">*</span>
              </Label>
              <Input
                id="dogAge"
                name="dogAge"
                type="text"
                required
                value={formData.dogAge}
                onChange={handleInputChange}
                placeholder="3 years"
                className={validationErrors.dogAge ? "border-red-500" : ""}
              />
              {validationErrors.dogAge && <p className="mt-1 text-sm text-red-600">{validationErrors.dogAge}</p>}
            </div>

            <div className="text-left">
              <Label htmlFor="dogWeight" className="block text-sm font-medium mb-1 font-sans">
                Dog's Weight (lbs)<span aria-hidden="true">*</span>
              </Label>
              <Input
                id="dogWeight"
                name="dogWeight"
                type="number"
                required
                value={formData.dogWeight}
                onChange={handleInputChange}
                placeholder="45"
                className={validationErrors.dogWeight ? "border-red-500" : ""}
              />
              {validationErrors.dogWeight && <p className="mt-1 text-sm text-red-600">{validationErrors.dogWeight}</p>}
            </div>

            <div className="text-left">
              <Label htmlFor="dogBreed" className="block text-sm font-medium mb-1 font-sans">
                Dog's Breed<span aria-hidden="true">*</span>
              </Label>
              <Input
                id="dogBreed"
                name="dogBreed"
                type="text"
                required
                value={formData.dogBreed}
                onChange={handleInputChange}
                placeholder="Golden Retriever"
                className={validationErrors.dogBreed ? "border-red-500" : ""}
              />
              {validationErrors.dogBreed && <p className="mt-1 text-sm text-red-600">{validationErrors.dogBreed}</p>}
            </div>

            <div className="text-left mb-6">
              <Label htmlFor="mobilePhone" className="block text-sm font-medium mb-1 font-sans">
                Mobile Phone (optional)
              </Label>
              <Input
                id="mobilePhone"
                name="mobilePhone"
                type="tel"
                value={formData.mobilePhone}
                onChange={handleInputChange}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="text-left mb-6">
              <Label htmlFor="medicalConditions" className="block text-sm font-medium mb-1 font-sans">
                Medical Conditions (optional)
              </Label>
              <Input
                id="medicalConditions"
                name="medicalConditions"
                type="text"
                value={formData.medicalConditions}
                onChange={handleInputChange}
                placeholder="e.g., allergies, diabetes, joint issues"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl px-4 py-3 font-semibold font-sans"
            >
              {isSubmitting ? "Submitting…" : "Join Now"}
            </Button>

            <p className="text-xs text-gray-500 mt-3 font-sans">No spam. Unsubscribe anytime.</p>

            <div className="mt-4 flex justify-center">
              <a
                href="https://www.instagram.com/nouripet/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                aria-label="Follow NouriPet on Instagram"
              >
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.057-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.073-1.689-.073-4.849 0-3.204.013-3.583.072-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <span className="sr-only">Instagram</span>
              </a>
            </div>
          </form>
        ) : (
          <div className="mt-6">
            <p className="text-lg font-medium mb-2 font-sans">Thanks! You're on the list. 🐾</p>
            <p className="text-sm text-gray-600 font-sans">We'll email you early access details soon.</p>
          </div>
        )}

        {showError && (
          <div className="mt-6">
            <p className="text-sm text-red-600 font-sans">
              Something went wrong—please try again. If the problem persists, the form may need to be configured for
              this domain.
            </p>
          </div>
        )}

        <div className="mt-8 flex justify-center space-x-4">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-800 underline font-sans">
            Already have access? Enter the main site
          </Link>
        </div>
      </section>
    </div>
  )
}
