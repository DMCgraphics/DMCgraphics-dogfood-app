"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu, X, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { hasValidSubscription } from "@/lib/route-guards"
import { useAuth } from "@/contexts/auth-context"
import { AuthModal } from "@/components/auth/auth-modal"
import { User, LogOut } from "lucide-react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")

  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const checkSubscription = () => {
      try {
        const isValid = hasValidSubscription()
        setHasSubscription(isValid)
      } catch (error) {
        console.error("Error checking subscription:", error)
        setHasSubscription(false)
      }
    }

    const timeoutId = setTimeout(checkSubscription, 0)

    // Listen for storage changes to update subscription status
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "nouripet_order" || e.key === null) {
        setTimeout(checkSubscription, 0)
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [mounted])

  const handleLogin = () => {
    setAuthMode("login")
    setShowAuthModal(true)
  }

  const handleSignup = () => {
    setAuthMode("signup")
    setShowAuthModal(true)
  }

  const handleLogout = () => {
    logout()
    setIsMenuOpen(false)
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    // Refresh subscription status after login
    setTimeout(() => {
      const isValid = hasValidSubscription()
      setHasSubscription(isValid)
    }, 100)
  }

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/nouripet-logo.svg" alt="NouriPet Logo" className="h-8 w-8" />
            <span className="font-serif text-xl font-bold">NouriPet</span>
          </Link>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button asChild className="hidden lg:inline-flex">
              <Link href="/plan-builder">Build Your Plan</Link>
            </Button>
            <Button variant="ghost" size="sm" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
    )
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/nouripet-logo.svg" alt="NouriPet Logo" className="h-8 w-8" />
            <span className="font-serif text-xl font-bold">NouriPet</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
              About Us
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors">
                Recipes
                <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href="/recipes">All Recipes</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/recipes/prescription">Prescription Diets</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/calculators" className="text-sm font-medium hover:text-primary transition-colors">
              Calculators
            </Link>
            {isAuthenticated && (
              <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                Dashboard
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden lg:flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {user?.name || "Account"}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders">Order History</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden lg:flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={handleLogin}>
                  Sign In
                </Button>
                <Button size="sm" onClick={handleSignup}>
                  Sign Up
                </Button>
              </div>
            )}

            <Button asChild className="hidden lg:inline-flex">
              <Link href="/plan-builder">Build Your Plan</Link>
            </Button>

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t bg-background">
            <nav className="container py-4 space-y-4">
              <Link href="/" className="block text-sm font-medium hover:text-primary transition-colors">
                Home
              </Link>
              <Link href="/about" className="block text-sm font-medium hover:text-primary transition-colors">
                About Us
              </Link>
              <Link href="/recipes" className="block text-sm font-medium hover:text-primary transition-colors">
                All Recipes
              </Link>
              <Link
                href="/recipes/prescription"
                className="block text-sm font-medium hover:text-primary transition-colors pl-4"
              >
                Prescription Diets
              </Link>
              <Link href="/calculators" className="block text-sm font-medium hover:text-primary transition-colors">
                Calculators
              </Link>
              {isAuthenticated && (
                <Link href="/dashboard" className="block text-sm font-medium hover:text-primary transition-colors">
                  Dashboard
                </Link>
              )}
              <Button asChild className="w-full">
                <Link href="/plan-builder">Build Your Plan</Link>
              </Button>

              <div className="pt-4 border-t space-y-2">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <User className="h-4 w-4" />
                      {user?.name}
                    </div>
                    <Link href="/profile" className="block text-sm font-medium hover:text-primary transition-colors">
                      Profile Settings
                    </Link>
                    <Link href="/orders" className="block text-sm font-medium hover:text-primary transition-colors">
                      Order History
                    </Link>
                    <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" onClick={handleLogin} className="w-full justify-start">
                      Sign In
                    </Button>
                    <Button onClick={handleSignup} className="w-full">
                      Sign Up
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
        onSuccess={handleAuthSuccess}
      />
    </>
  )
}
