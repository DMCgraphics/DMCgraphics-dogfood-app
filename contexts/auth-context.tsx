"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import type { User } from "@/lib/auth"

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
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name || session.user.email!.split("@")[0],
            createdAt: session.user.created_at,
            subscriptionStatus: "none",
          }
          setUser(userData)
          setApiStatus("connected")
          console.log("[v0] auth_supabase_session_found", { userId: userData.id })
        } else {
          console.log("[v0] auth_no_session")
          setApiStatus("disconnected")
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        setApiStatus("disconnected")
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] auth_state_change", { event, hasSession: !!session })

      if (event === "SIGNED_IN" && session?.user) {
        const userData: User = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.email!.split("@")[0],
          createdAt: session.user.created_at,
          subscriptionStatus: "none",
        }
        setUser(userData)
        setApiStatus("connected")
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setApiStatus("disconnected")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, []) // Removed supabase dependency since it's now a stable import

  const login = async (userData: User, token: string) => {
    setUser(userData)
    setApiStatus("connected")
    console.log("[v0] auth_login", { userId: userData.id })
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setApiStatus("disconnected")
      console.log("[v0] auth_logout")
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
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
