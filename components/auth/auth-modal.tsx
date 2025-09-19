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

  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode)
    }
  }, [isOpen, defaultMode])

  // No auto-close logic - modals only close when user clicks the button

  // No fallback timeout - modals only close when user explicitly closes them

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
          />
        ) : (
          <SignupForm 
            onSuccess={handleSuccess} 
            onSwitchToLogin={() => setMode("login")} 
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
