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
      setHasUserInteracted(false)
    }
  }, [isOpen, defaultMode])

  // Auto-close modal when user becomes authenticated
  useEffect(() => {
    console.log("[v0] auth_modal_state_check", { 
      isAuthenticated, 
      isOpen, 
      hasUserInteracted,
      mode 
    })
    
    if (isAuthenticated && isOpen) {
      console.log("[v0] auth_modal_auto_close_on_auth", { isAuthenticated, hasUserInteracted })
      // Reduce delay to prevent timeout issues
      setTimeout(() => {
        console.log("[v0] auth_modal_closing_now")
        onSuccess?.()
        onClose()
      }, 500) // Reduced delay to 500ms
    }
  }, [isAuthenticated, isOpen, onSuccess, onClose])

  const handleSuccess = () => {
    console.log("[v0] auth_modal_handle_success")
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
            onUserInteraction={() => setHasUserInteracted(true)}
          />
        ) : (
          <SignupForm 
            onSuccess={handleSuccess} 
            onSwitchToLogin={() => setMode("login")} 
            onUserInteraction={() => setHasUserInteracted(true)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
