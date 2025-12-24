"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gift, Copy, Check, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface PromoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Snowflake component
function Snowflake({ delay, duration, left }: { delay: number; duration: number; left: number }) {
  return (
    <div
      className="absolute top-0 text-white/60 dark:text-white/40 pointer-events-none"
      style={{
        left: `${left}%`,
        animation: `snowfall ${duration}s linear ${delay}s infinite`,
        fontSize: `${Math.random() * 10 + 10}px`,
      }}
    >
      ❄
    </div>
  )
}

export function PromoModal({ open, onOpenChange }: PromoModalProps) {
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const copyCode = () => {
    navigator.clipboard.writeText('NOURI15')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShopNow = () => {
    onOpenChange(false)
    router.push('/plan-builder')
  }

  // Generate snowflakes with random positions and timing
  const snowflakes = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: Math.random() * 5,
    duration: Math.random() * 3 + 5,
    left: Math.random() * 100,
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950 border-2 border-primary/20 overflow-hidden">
        {/* Snow animation overlay */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <style jsx>{`
            @keyframes snowfall {
              0% {
                transform: translateY(-10px) rotate(0deg);
                opacity: 0;
              }
              10% {
                opacity: 1;
              }
              90% {
                opacity: 1;
              }
              100% {
                transform: translateY(100vh) rotate(360deg);
                opacity: 0;
              }
            }
          `}</style>
          {snowflakes.map((flake) => (
            <Snowflake
              key={flake.id}
              delay={flake.delay}
              duration={flake.duration}
              left={flake.left}
            />
          ))}
        </div>

        <DialogHeader className="text-center space-y-3 relative z-10">
          <div className="flex items-center justify-center gap-2 text-4xl">
            <Gift className="h-8 w-8 text-primary" />
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-3xl font-bold text-primary text-center">
            Holiday Special!
          </DialogTitle>
          <DialogDescription className="text-lg text-foreground text-center">
            Get <span className="font-bold text-primary text-xl">15% Off Your First Month</span>
          </DialogDescription>
          <Badge className="mx-auto bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-900 text-sm px-4 py-1">
            Subscription Plans Only
          </Badge>
        </DialogHeader>

        <div className="space-y-6 pt-4 relative z-10">
          {/* Promo Code Section */}
          <div className="space-y-2">
            <p className="text-center text-sm text-muted-foreground font-medium">
              Use code at checkout:
            </p>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border-2 border-primary/30 rounded-lg p-4 shadow-sm">
              <code className="flex-1 text-center text-2xl font-bold text-primary tracking-wider">
                NOURI15
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={copyCode}
                className={cn(
                  "shrink-0",
                  copied && "bg-green-100 border-green-300 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-100"
                )}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleShopNow}
            className="w-full text-lg py-6"
            size="lg"
          >
            Build Your Plan
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Start building a custom meal plan for your pup and save 15% on your first month
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
