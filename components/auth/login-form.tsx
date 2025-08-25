"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, User, Lock } from "lucide-react"
import Link from "next/link"
import { storeAuthData, getApiConfig } from "@/lib/auth"

interface LoginFormProps {
  onSuccess?: () => void
  onSwitchToSignup?: () => void
}

interface LoginResponse {
  message: string
  token: string
  user: {
    id: string
    username: string
    email: string
    name?: string
    createdAt?: string
    subscriptionStatus?: "none" | "active" | "paused" | "cancelled"
  }
}

export function LoginForm({ onSuccess, onSwitchToSignup }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const apiConfig = getApiConfig()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // If API is not configured, use demo/local authentication
      if (!apiConfig.isConfigured) {
        console.log("[v0] using_demo_auth", { reason: "api_not_configured" })

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const userData = {
          id: `demo-${Date.now()}`,
          email: username,
          name: username.split("@")[0] || "Demo User",
          createdAt: new Date().toISOString(),
          subscriptionStatus: "active" as const,
        }

        storeAuthData(userData, `demo-token-${Date.now()}`)
        console.log("[v0] demo_login_success", { email: username })
        onSuccess?.()
        return
      }

      const response = await fetch(`${apiConfig.baseUrl}/auth/sign-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: username,
          password,
        }),
      })

      const data: LoginResponse = await response.json()

      if (response.ok) {
        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name || data.user.username,
          createdAt: data.user.createdAt || new Date().toISOString(),
          subscriptionStatus: data.user.subscriptionStatus || ("none" as const),
        }

        storeAuthData(userData, data.token)

        console.log("[v0] user_login_success", { email: data.user.email })
        onSuccess?.()
      } else {
        throw new Error(data.message || "Login failed")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred during login"

      // If it's a network error and API is configured, suggest fallback
      if (errorMessage.includes("fetch") && apiConfig.isConfigured) {
        setError("Cannot connect to authentication server. Please check your network connection or try again later.")
      } else {
        setError(errorMessage)
      }

      console.log("[v0] user_login_failed", { username, error: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <p className="text-muted-foreground">
          {apiConfig.isConfigured ? "Sign in to your NouriPet account" : "Demo Mode - Enter any email to continue"}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!apiConfig.isConfigured && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800">
                <strong>Demo Mode:</strong> Flask API not configured. Enter any email address to sign in with demo
                credentials.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Email</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                type="email"
                placeholder={apiConfig.isConfigured ? "Enter your email" : "Enter any email (demo)"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={apiConfig.isConfigured ? "Enter your password" : "Enter any password (demo)"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required={apiConfig.isConfigured}
                autoComplete="current-password"
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

          {apiConfig.isConfigured && (
            <div className="flex items-center justify-between text-sm">
              <Link href="/auth/forgot-password" className="text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button type="button" onClick={onSwitchToSignup} className="text-primary hover:underline font-medium">
              Sign up
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
