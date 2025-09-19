"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { LoginForm } from "./login-form"
import { SignupForm } from "./signup-form"
import { useAuth } from "@/contexts/auth-context"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: "login" | "signup"
  onSuccess?: () => void
}

export function AuthModal({ isOpen, onClose, defaultMode = "login", onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">(defaultMode)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode)
      setHasUserInteracted(false) // Reset interaction state when modal opens
    }
  }, [isOpen, defaultMode])

  // Auto-close modal when user becomes authenticated (but only if they haven't recently interacted)
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      console.log("[v0] auth_modal_auto_close", { isAuthenticated, hasUserInteracted })
      
      // Only auto-close if user hasn't interacted with the form recently
      if (!hasUserInteracted) {
        // Add a delay to ensure the user has finished their action
        const timeout = setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 1500) // Increased delay to 1.5 seconds
        
        return () => clearTimeout(timeout)
      } else {
        // User has interacted, wait longer before auto-closing
        const timeout = setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 3000) // 3 seconds if user has interacted
        
        return () => clearTimeout(timeout)
      }
    }
  }, [isAuthenticated, isOpen, hasUserInteracted, onSuccess, onClose])

  // Fallback timeout to close modal after 10 seconds if it gets stuck
  useEffect(() => {
    if (isOpen) {
      const timeout = setTimeout(() => {
        console.log("[v0] auth_modal_timeout_fallback")
        onClose()
      }, 10000) // 10 seconds

      return () => clearTimeout(timeout)
    }
  }, [isOpen, onClose])

  const handleSuccess = () => {
    console.log("[v0] auth_modal_handle_success", { hasUserInteracted })
    onSuccess?.()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 bg-transparent border-none shadow-none max-h-[90vh] overflow-y-auto">
        <VisuallyHidden>
          <DialogTitle>{mode === "login" ? "Sign In" : "Sign Up"}</DialogTitle>
          <DialogDescription>
            {mode === "login" ? "Sign in to your NouriPet account" : "Create a new NouriPet account"}
          </DialogDescription>
        </VisuallyHidden>

        {mode === "login" ? (
          <LoginForm 
            onSuccess={handleSuccess} 
            onSwitchToSignup={() => setMode("signup")} 
            onUserInteraction={() => {
              console.log("[v0] auth_modal_user_interaction_login")
              setHasUserInteracted(true)
            }}
          />
        ) : (
          <SignupForm 
            onSuccess={handleSuccess} 
            onSwitchToLogin={() => setMode("login")} 
            onUserInteraction={() => {
              console.log("[v0] auth_modal_user_interaction_signup")
              setHasUserInteracted(true)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
