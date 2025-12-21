"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock, User, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"

interface SignupFormProps {
  onSuccess?: (subscriptionId?: string) => void
  onSwitchToLogin?: () => void
  onUserInteraction?: () => void
  inviteToken?: string
}

export function SignupForm({ onSuccess, onSwitchToLogin, onUserInteraction, inviteToken }: SignupFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [invitation, setInvitation] = useState<any>(null)
  const [isVerifyingInvite, setIsVerifyingInvite] = useState(false)
  const [inviteError, setInviteError] = useState("")

  // Verify invitation token on mount
  useEffect(() => {
    if (inviteToken) {
      verifyInvitation()
    }
  }, [inviteToken])

  const verifyInvitation = async () => {
    setIsVerifyingInvite(true)
    setInviteError("")

    try {
      const response = await fetch(`/api/invitations/verify?token=${inviteToken}`)
      const data = await response.json()

      if (data.valid && data.invitation) {
        setInvitation(data.invitation)
        // Pre-fill email from invitation
        setFormData(prev => ({
          ...prev,
          email: data.invitation.email,
          name: data.invitation.customerName || ""
        }))
      } else {
        setInviteError(data.error || "Invalid invitation link")
      }
    } catch (err: any) {
      console.error("Failed to verify invitation:", err)
      setInviteError("Failed to verify invitation. Please try again.")
    } finally {
      setIsVerifyingInvite(false)
    }
  }

  // Auth context will automatically handle signup via auth state changes

  const isFormValid =
    formData.name.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.password.length >= 6 &&
    formData.confirmPassword !== "" &&
    formData.password === formData.confirmPassword &&
    acceptTerms

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    onUserInteraction?.()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Client-side validation
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords don't match")
      }
      if (formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters")
      }
      if (!acceptTerms) {
        throw new Error("Please accept the terms and conditions")
      }

      console.log("[v0] signup_attempt_start", {
        email: formData.email,
        name: formData.name,
      })

      // Use Supabase directly instead of the auth library
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { name: formData.name },
        },
      })

      if (error) {
        throw error
      }

      if (data.user) {
        console.log("[v0] user_signup_success", {
          email: formData.email,
          name: formData.name,
          userId: data.user.id,
          hasInvitation: !!inviteToken
        })

        // Send welcome email (non-blocking)
        fetch("/api/emails/welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            name: formData.name
          })
        }).catch(err => {
          console.error("[v0] welcome_email_failed", err)
          // Don't block signup flow if email fails
        })

        // Store subscription ID to pass to redirect handler
        let claimedSubscriptionId: string | undefined = undefined

        // If there's an invitation, claim it
        if (inviteToken) {
          try {
            const claimResponse = await fetch("/api/invitations/claim", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token: inviteToken,
                userId: data.user.id
              })
            })

            const claimData = await claimResponse.json()

            if (!claimData.success) {
              console.error("[v0] invitation_claim_failed", claimData.error)
              setError(`Account created but failed to link subscription: ${claimData.error}`)
              setIsLoading(false)
              return
            }

            // Capture subscription ID for redirect
            claimedSubscriptionId = claimData.subscription?.id

            console.log("[v0] invitation_claimed_success", {
              userId: data.user.id,
              subscriptionId: claimedSubscriptionId
            })
          } catch (claimError: any) {
            console.error("[v0] invitation_claim_error", claimError)
            setError("Account created but failed to link subscription. Please contact support.")
            setIsLoading(false)
            return
          }
        }

        // Claim any guest orders with matching email
        try {
          const claimResponse = await fetch("/api/orders/claim-guest-orders", {
            method: "POST",
          })
          const claimData = await claimResponse.json()

          if (claimData.success && claimData.claimed > 0) {
            console.log("[v0] guest_orders_claimed", {
              count: claimData.claimed,
              orderIds: claimData.orders?.map((o: any) => o.id)
            })
          }
        } catch (error) {
          console.error("[v0] Failed to claim guest orders:", error)
          // Don't block signup on failure - user can still access orders via email match
        }

        // The auth context will automatically handle the session change
        // Call onSuccess immediately - the parent component will handle modal closing
        setIsLoading(false)

        // Add a fallback timeout to ensure modal closes even if auth state doesn't update
        setTimeout(() => {
          console.log("[v0] signup_form_fallback_close")
          onSuccess?.(claimedSubscriptionId)
        }, 1000) // Reduced to 1 second fallback

        // Call onSuccess immediately as primary mechanism
        onSuccess?.(claimedSubscriptionId)
      } else {
        setIsLoading(false)
      }
    } catch (err: any) {
      console.log("[v0] user_signup_failed", {
        email: formData.email,
        error: err.message,
      })

      const errorMessage =
        err.message?.includes("already registered") || err.message?.includes("User already registered")
          ? "Email already registered. Try signing in instead."
          : err.message || "Sign up failed. Please try again."

      setError(errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          {invitation ? "Claim Your Subscription" : "Create Account"}
        </CardTitle>
        <p className="text-muted-foreground">
          {invitation
            ? "Set up your account to access your active subscription"
            : "Join NouriPet to track your dog's health"}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isVerifyingInvite && (
            <Alert>
              <AlertDescription>Verifying invitation...</AlertDescription>
            </Alert>
          )}

          {inviteError && (
            <Alert variant="destructive">
              <AlertDescription>{inviteError}</AlertDescription>
            </Alert>
          )}

          {invitation && !inviteError && (
            <Alert className="border-green-200 bg-green-50 text-green-900">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                Welcome back! Creating an account for your existing subscription.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="pl-10"
                required
                disabled={!!invitation}
                readOnly={!!invitation}
              />
              {invitation && (
                <p className="text-xs text-muted-foreground mt-1">
                  Email locked from invitation
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
            />
            <Label htmlFor="terms" className="text-xs sm:text-sm leading-tight">
              I agree to the{" "}
              <a href="/terms" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </Label>
          </div>

          {!isFormValid && formData.email && (
            <div className="text-sm text-muted-foreground">
              {!acceptTerms && "Please accept the terms and conditions to continue"}
              {acceptTerms && formData.password !== formData.confirmPassword && "Passwords don't match"}
              {acceptTerms && formData.password.length < 6 && "Password must be at least 6 characters"}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading || !isFormValid}>
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button type="button" onClick={onSwitchToLogin} className="text-primary hover:underline font-medium">
              Sign in
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
