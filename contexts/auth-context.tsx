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
  refreshUserProfile: () => Promise<void>
  refreshSubscriptionStatus: () => Promise<void>
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
          // First, create user with default subscription status
          const userData: User = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name || session.user.email!.split("@")[0],
            avatar_url: undefined, // Will be loaded separately when needed
            createdAt: session.user.created_at,
            subscriptionStatus: "none",
          }
          setUser(userData)
          setApiStatus("connected")
          console.log("[v0] auth_supabase_session_found", { userId: userData.id })

          // Then, fetch real subscription status from database
          try {
            const { data: subscriptionsData } = await supabase
              .from("subscriptions")
              .select("id, status")
              .eq("user_id", session.user.id)
              .in("status", ["active", "trialing", "past_due"])

            const hasActiveSubscription = subscriptionsData && subscriptionsData.length > 0
            
            if (hasActiveSubscription) {
              const updatedUser = { ...userData, subscriptionStatus: "active" as const }
              setUser(updatedUser)
              console.log("[v0] auth_subscription_status_updated", { 
                userId: userData.id, 
                hasActiveSubscription: true,
                subscriptionCount: subscriptionsData.length 
              })
            } else {
              console.log("[v0] auth_no_active_subscription", { userId: userData.id })
            }
          } catch (subscriptionError) {
            console.error("Error fetching subscription status:", subscriptionError)
            // Keep the default "none" status if there's an error
          }
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
        // First, create user with default subscription status
        const userData: User = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.email!.split("@")[0],
          avatar_url: undefined, // Will be loaded separately when needed
          createdAt: session.user.created_at,
          subscriptionStatus: "none",
        }
        setUser(userData)
        setApiStatus("connected")

        // Then, fetch real subscription status from database
        try {
          const { data: subscriptionsData } = await supabase
            .from("subscriptions")
            .select("id, status")
            .eq("user_id", session.user.id)
            .in("status", ["active", "trialing", "past_due"])

          const hasActiveSubscription = subscriptionsData && subscriptionsData.length > 0
          
          if (hasActiveSubscription) {
            const updatedUser = { ...userData, subscriptionStatus: "active" as const }
            setUser(updatedUser)
            console.log("[v0] auth_subscription_status_updated_on_signin", { 
              userId: userData.id, 
              hasActiveSubscription: true,
              subscriptionCount: subscriptionsData.length 
            })
          } else {
            console.log("[v0] auth_no_active_subscription_on_signin", { userId: userData.id })
          }
        } catch (subscriptionError) {
          console.error("Error fetching subscription status on signin:", subscriptionError)
          // Keep the default "none" status if there's an error
        }
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

  const refreshUserProfile = async () => {
    if (!user?.id) return

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single()

      if (!profileError && profile) {
        const updatedUser = { 
          ...user, 
          name: profile.full_name || user.name,
          avatar_url: profile.avatar_url 
        }
        setUser(updatedUser)
        console.log("[v0] auth_profile_refreshed", { userId: user.id })
      } else {
        console.log("[v0] No profile found during refresh:", profileError?.message)
      }
    } catch (error) {
      console.error("Error refreshing user profile:", error)
    }
  }

  const refreshSubscriptionStatus = async () => {
    if (!user?.id) return

    try {
      const { data: subscriptionsData } = await supabase
        .from("subscriptions")
        .select("id, status")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing", "past_due"])

      const hasActiveSubscription = subscriptionsData && subscriptionsData.length > 0
      const newSubscriptionStatus = hasActiveSubscription ? "active" : "none"
      
      if (user.subscriptionStatus !== newSubscriptionStatus) {
        const updatedUser = { ...user, subscriptionStatus: newSubscriptionStatus as "active" | "none" }
        setUser(updatedUser)
        console.log("[v0] auth_subscription_status_refreshed", { 
          userId: user.id, 
          oldStatus: user.subscriptionStatus,
          newStatus: newSubscriptionStatus,
          subscriptionCount: subscriptionsData?.length || 0
        })
      }
    } catch (error) {
      console.error("Error refreshing subscription status:", error)
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
    refreshUserProfile,
    refreshSubscriptionStatus,
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
