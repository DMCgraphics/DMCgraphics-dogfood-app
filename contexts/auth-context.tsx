"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import {
  getCurrentUser,
  getAuthToken,
  logout as authLogout,
  validateSession,
  getApiConfig,
  type User,
} from "@/lib/auth"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  hasSubscription: boolean
  isLoading: boolean
  login: (userData: User, token: string) => void
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  apiStatus: "unknown" | "connected" | "disconnected"
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [apiStatus, setApiStatus] = useState<"unknown" | "connected" | "disconnected">("unknown")

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = getCurrentUser()
        const token = getAuthToken()
        const apiConfig = getApiConfig()

        if (currentUser && token) {
          console.log("[v0] auth_using_local_session", { userId: currentUser.id })
          setUser(currentUser)
          setApiStatus("disconnected") // Default to disconnected, will update if API responds

          // Try to validate session with Flask API in background (non-blocking)
          try {
            const validatedUser = await validateSession()
            if (validatedUser) {
              setUser(validatedUser)
              setApiStatus("connected")
              console.log("[v0] auth_session_validated", { userId: validatedUser.id })
            } else {
              // Session invalid on server, but keep local session for now
              setApiStatus("connected")
              console.log("[v0] auth_session_invalid_on_server")
            }
          } catch (error) {
            // API unreachable, continue with local session
            console.log("[v0] auth_api_unreachable_background", {
              error: error instanceof Error ? error.message : "unknown",
            })
            // Keep apiStatus as "disconnected" and user as currentUser
          }
        } else {
          // No local session data
          setApiStatus("disconnected")
          console.log("[v0] auth_no_local_session")
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        setApiStatus("disconnected")
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for storage changes (e.g., login/logout in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "nouripet_user" || e.key === "nouripet_auth_token") {
        const currentUser = getCurrentUser()
        const token = getAuthToken()

        if (currentUser && token) {
          setUser(currentUser)
          console.log("[v0] auth_session_updated", { userId: currentUser.id })
        } else {
          setUser(null)
          console.log("[v0] auth_session_cleared")
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  const login = (userData: User, token: string) => {
    localStorage.setItem("nouripet_user", JSON.stringify(userData))
    localStorage.setItem("nouripet_auth_token", token)
    setUser(userData)
    setApiStatus("connected")
    console.log("[v0] auth_login", { userId: userData.id })
  }

  const logout = async () => {
    try {
      await authLogout()
    } catch (error) {
      console.error("Error during logout:", error)
    }
    setUser(null)
    setApiStatus("disconnected")
    console.log("[v0] auth_logout")
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      localStorage.setItem("nouripet_user", JSON.stringify(updatedUser))
      setUser(updatedUser)
      console.log("[v0] auth_user_updated", { userId: user.id, updates: Object.keys(userData) })
    }
  }

  const hasSubscription = user?.subscriptionStatus === "active"

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    hasSubscription,
    isLoading,
    login,
    logout,
    updateUser,
    apiStatus,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
