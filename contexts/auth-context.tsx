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
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  refreshUserProfile: () => Promise<void>
  refreshSubscriptionStatus: () => Promise<void>
  forceRefreshAuth: () => Promise<void>
  forceClearAuth: () => Promise<void>
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
        // Clear any existing user state first
        setUser(null)
        setApiStatus("unknown")
        
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
          console.log("[v0] auth_supabase_session_found", { userId: userData.id, email: userData.email })

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
                email: userData.email,
                hasActiveSubscription: true,
                subscriptionCount: subscriptionsData.length 
              })
            } else {
              console.log("[v0] auth_no_active_subscription", { userId: userData.id, email: userData.email })
            }
          } catch (subscriptionError) {
            console.error("Error fetching subscription status:", subscriptionError)
            // Keep the default "none" status if there's an error
          }
        } else {
          console.log("[v0] auth_no_session")
          setUser(null)
          setApiStatus("disconnected")
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        setUser(null)
        setApiStatus("disconnected")
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] auth_state_change", { event, hasSession: !!session, userId: session?.user?.id, email: session?.user?.email })

      if (event === "SIGNED_IN" && session?.user) {
        // Only process if we don't already have this user
        if (user?.id !== session.user.id) {
          // Clear any existing user state first
          setUser(null)
          
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
          console.log("[v0] auth_signed_in", { userId: userData.id, email: userData.email })

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
                email: userData.email,
                hasActiveSubscription: true,
                subscriptionCount: subscriptionsData.length 
              })
            } else {
              console.log("[v0] auth_no_active_subscription_on_signin", { userId: userData.id, email: userData.email })
            }
          } catch (subscriptionError) {
            console.error("Error fetching subscription status on signin:", subscriptionError)
            // Keep the default "none" status if there's an error
          }
        } else {
          console.log("[v0] auth_signed_in_duplicate_ignored", { userId: session.user.id, email: session.user.email })
        }
      } else if (event === "SIGNED_OUT") {
        console.log("[v0] auth_state_change_signed_out")
        setUser(null)
        setApiStatus("disconnected")
      } else if (event === "TOKEN_REFRESHED") {
        console.log("[v0] auth_token_refreshed", { userId: session?.user?.id, email: session?.user?.email })
        // Token refreshed, but user should remain the same
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, []) // Removed supabase dependency since it's now a stable import

  // Note: Login is now handled automatically by the auth state change handler
  // when Supabase auth state changes

  const logout = async () => {
    try {
      console.log("[v0] auth_logout_starting")
      
      // Clear local state immediately to prevent race conditions
      setUser(null)
      setApiStatus("disconnected")
      
      // Clear all auth-related localStorage data (but keep site_authenticated for gated access)
      const keysToRemove = [
        'nouripet-order-confirmation',
        'nouripet-checkout-plan',
        'nouripet-selected-dog',
        'nouripet-add-dog-mode',
        'nouripet-total-dogs',
        'nouripet_user' // Clear any cached user data
      ]
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })
      
      // Clear any saved plan data
      const allKeys = Object.keys(localStorage)
      allKeys.forEach(key => {
        if (key.startsWith('nouripet-saved-plan-')) {
          localStorage.removeItem(key)
        }
      })
      
      // Clear all cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      })
      
      // Force sign out from Supabase
      await supabase.auth.signOut()
      
      // Additional cleanup - clear any remaining session data
      try {
        await supabase.auth.getSession()
      } catch (e) {
        // Ignore errors here, we're just trying to clear the session
      }
      
      console.log("[v0] auth_logout_completed")
    } catch (error) {
      console.error("Error during logout:", error)
      // Even if there's an error, ensure local state is cleared
      setUser(null)
      setApiStatus("disconnected")
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
          email: user.email,
          oldStatus: user.subscriptionStatus,
          newStatus: newSubscriptionStatus,
          subscriptionCount: subscriptionsData?.length || 0
        })
      }
    } catch (error) {
      console.error("Error refreshing subscription status:", error)
    }
  }

  const forceRefreshAuth = async () => {
    try {
      console.log("[v0] force_refresh_auth_starting")
      setUser(null)
      setApiStatus("unknown")
      
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        const userData: User = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.email!.split("@")[0],
          avatar_url: undefined,
          createdAt: session.user.created_at,
          subscriptionStatus: "none",
        }
        setUser(userData)
        setApiStatus("connected")
        console.log("[v0] force_refresh_auth_completed", { userId: userData.id, email: userData.email })
      } else {
        setUser(null)
        setApiStatus("disconnected")
        console.log("[v0] force_refresh_auth_no_session")
      }
    } catch (error) {
      console.error("Error in force refresh auth:", error)
      setUser(null)
      setApiStatus("disconnected")
    }
  }

  const forceClearAuth = async () => {
    try {
      console.log("[v0] force_clear_auth_starting")
      
      // Clear local state
      setUser(null)
      setApiStatus("disconnected")
      
      // Clear all localStorage
      const keysToRemove = [
        'nouripet-order-confirmation',
        'nouripet-checkout-plan',
        'nouripet-selected-dog',
        'nouripet-add-dog-mode',
        'nouripet-total-dogs',
        'nouripet_user'
      ]
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })
      
      // Clear any saved plan data
      const allKeys = Object.keys(localStorage)
      allKeys.forEach(key => {
        if (key.startsWith('nouripet-saved-plan-')) {
          localStorage.removeItem(key)
        }
      })
      
      // Clear all cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      })
      
      // Force sign out from Supabase
      await supabase.auth.signOut()
      
      console.log("[v0] force_clear_auth_completed")
    } catch (error) {
      console.error("Error in force clear auth:", error)
      setUser(null)
      setApiStatus("disconnected")
    }
  }

  const hasSubscription = user?.subscriptionStatus === "active"

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    hasSubscription,
    isLoading,
    logout,
    updateUser,
    refreshUserProfile,
    refreshSubscriptionStatus,
    forceRefreshAuth,
    forceClearAuth,
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
