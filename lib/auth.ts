"use client"

export interface User {
  id: string
  email: string
  name: string
  createdAt: string
  subscriptionStatus: "none" | "active" | "paused" | "cancelled"
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.includes("chat.google.com")
  ? "https://nouripet.net/api"
  : process.env.NEXT_PUBLIC_API_BASE_URL || "https://nouripet.net/api"

const JWT_COOKIE_NAME = process.env.JWT_COOKIE_NAME || "auth_token"

export async function checkApiHealth(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return response.ok
  } catch (error) {
    console.error("Flask API health check failed:", error)
    return false
  }
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null
  return null
}

function setCookie(name: string, value: string, days = 7): void {
  if (typeof document === "undefined") return

  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;secure;samesite=none`
}

function deleteCookie(name: string): void {
  if (typeof document === "undefined") return

  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;secure;samesite=none`
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  try {
    const userData = localStorage.getItem("nouripet_user")
    return userData ? JSON.parse(userData) : null
  } catch {
    return null
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null

  return getCookie(JWT_COOKIE_NAME) || localStorage.getItem("nouripet_auth_token")
}

export async function logout(): Promise<void> {
  try {
    const token = getAuthToken()
    if (token) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      await fetch(`${API_BASE_URL}/auth/sign-out`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
    }
  } catch (error) {
    console.error("Error during logout API call:", error)
    // Continue with local cleanup even if API call fails
  } finally {
    // Clear local storage and cookies
    localStorage.removeItem("nouripet_user")
    localStorage.removeItem("nouripet_auth_token")
    localStorage.removeItem("nouripet_order")
    deleteCookie(JWT_COOKIE_NAME)

    // Redirect to home page
    window.location.href = "/"
  }
}

export async function validateSession(): Promise<User | null> {
  const token = getAuthToken()
  if (!token) return null

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(`${API_BASE_URL}/auth/session`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      return data.user
    } else if (response.status === 401) {
      // Invalid token, clear auth data
      localStorage.removeItem("nouripet_user")
      localStorage.removeItem("nouripet_auth_token")
      deleteCookie(JWT_COOKIE_NAME)
      return null
    } else {
      throw new Error(`Session validation failed: ${response.status}`)
    }
  } catch (error) {
    console.error("Error validating session:", error)

    if (error instanceof Error && (error.name === "AbortError" || error.message.includes("fetch"))) {
      console.warn("Flask API unreachable, using local session fallback")
      return getCurrentUser() // Return local user data as fallback
    }

    return null
  }
}

export function updateUserSubscriptionStatus(status: User["subscriptionStatus"]): void {
  const user = getCurrentUser()
  if (user) {
    user.subscriptionStatus = status
    localStorage.setItem("nouripet_user", JSON.stringify(user))
  }
}

export function storeAuthData(user: User, token: string): void {
  localStorage.setItem("nouripet_user", JSON.stringify(user))
  localStorage.setItem("nouripet_auth_token", token)
  setCookie(JWT_COOKIE_NAME, token)
}

export function getApiConfig() {
  return {
    baseUrl: API_BASE_URL,
    cookieName: JWT_COOKIE_NAME,
    isConfigured: !!process.env.NEXT_PUBLIC_API_BASE_URL,
  }
}
