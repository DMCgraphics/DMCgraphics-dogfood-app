"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Gift, Mail, FileText, X } from "lucide-react"
import { metaPixelEvents } from "@/components/meta-pixel"

interface ExitIntentPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExitIntentPopup({ open, onOpenChange }: ExitIntentPopupProps) {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return
    }

    setLoading(true)

    try {
      // Track lead capture in Meta Pixel
      metaPixelEvents.lead({
        content_name: "Exit Intent - Free Feeding Guide",
        value: 5, // Estimate lead value
      })

      // TODO: Send to your email marketing system (Resend, Mailchimp, etc.)
      // For now, just store in localStorage and show success
      const leads = JSON.parse(localStorage.getItem("nouripet-exit-intent-leads") || "[]")
      leads.push({
        email,
        timestamp: new Date().toISOString(),
        source: "exit-intent",
      })
      localStorage.setItem("nouripet-exit-intent-leads", JSON.stringify(leads))

      setSubmitted(true)

      // Auto-close after 3 seconds
      setTimeout(() => {
        onOpenChange(false)
        setEmail("")
        setSubmitted(false)
      }, 3000)
    } catch (error) {
      console.error("Error submitting exit intent form:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 border-2 border-primary/20">
        {!submitted ? (
          <>
            <DialogHeader className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-4xl">
                <Gift className="h-8 w-8 text-primary animate-bounce" />
              </div>
              <DialogTitle className="text-2xl font-bold text-primary text-center">
                Wait! Don't Leave Empty-Handed
              </DialogTitle>
              <DialogDescription className="text-base text-foreground text-center space-y-2">
                <p>
                  Get our <span className="font-bold text-primary">Free Dog Nutrition Guide</span>
                </p>
                <p className="text-sm">
                  Plus <span className="font-semibold">10% off</span> your first order
                </p>
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="exit-email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="exit-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  "Sending..."
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Get My Free Guide + 10% Off
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                We'll email you the guide instantly. Unsubscribe anytime.
              </p>
            </form>

            <div className="mt-4 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
              <p className="text-xs text-center font-medium text-foreground/80">
                🐾 Perfect for Westchester & Fairfield County dog parents
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-8 space-y-4">
            <div className="flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
              Check Your Inbox!
            </DialogTitle>
            <DialogDescription className="text-base">
              We've sent the Free Dog Nutrition Guide to <span className="font-semibold">{email}</span>
            </DialogDescription>
            <p className="text-sm text-muted-foreground">
              Your 10% off code: <span className="font-mono font-bold text-primary">WELCOME10</span>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
