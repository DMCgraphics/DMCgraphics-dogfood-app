"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu, X, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { AuthModal } from "@/components/auth/auth-modal"
import { User, LogOut } from "lucide-react"
import { UserMenu } from "@/components/nav/user-menu"
import { DogSelectionModal } from "@/components/modals/dog-selection-modal"
import { useRouter } from "next/navigation"
import { SubscriptionManagementModal } from "@/components/modals/subscription-management-modal"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const [openDogModal, setOpenDogModal] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  const { user, isAuthenticated, hasSubscription, loading, logout, forceClearAuth } = useAuth()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogin = () => {
    setAuthMode("login")
    setShowAuthModal(true)
  }

  const handleSignup = () => {
    setAuthMode("signup")
    setShowAuthModal(true)
  }

  const handleLogout = async () => {
    try {
      console.log("[v0] Header - Starting logout")
      await logout()
      setIsMenuOpen(false)
      console.log("[v0] Header - Logout completed, redirecting")
      // Force a hard refresh to ensure all state is cleared
      window.location.href = "/"
    } catch (error) {
      console.error("[v0] Header - Logout error:", error)
      // Even if logout fails, redirect to clear any cached state
      window.location.href = "/"
    }
  }

  const handleForceClear = async () => {
    try {
      console.log("[v0] Header - Starting force clear")
      await forceClearAuth()
      setIsMenuOpen(false)
      console.log("[v0] Header - Force clear completed, redirecting")
      // Force a hard refresh to ensure all state is cleared
      window.location.href = "/"
    } catch (error) {
      console.error("[v0] Header - Force clear error:", error)
      // Even if force clear fails, redirect to clear any cached state
      window.location.href = "/"
    }
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    // Auth context will automatically update subscription status
  }

  if (!mounted || loading) {
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
                <DropdownMenuItem asChild>
                  <Link href="/feeding-guide">Feeding Guide</Link>
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
            {isAuthenticated && user?.roles?.includes('delivery_driver') && (
              <Link href="/delivery" className="text-sm font-medium hover:text-primary transition-colors text-blue-600">
                Delivery
              </Link>
            )}
            {isAuthenticated && user?.isAdmin && (
              <Link href="/admin" className="text-sm font-medium hover:text-primary transition-colors text-purple-600">
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {isAuthenticated ? (
              <div className="hidden lg:block">
                <UserMenu />
              </div>
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

            {isAuthenticated ? (
              hasSubscription ? (
                <Button className="hidden lg:inline-flex" onClick={() => setShowSubscriptionModal(true)}>
                  Manage Subscription
                </Button>
              ) : (
                <Button asChild className="hidden lg:inline-flex">
                  <Link href="/plan-builder">Build Your Plan</Link>
                </Button>
              )
            ) : (
              <Button asChild className="hidden lg:inline-flex">
                <Link href="/plan-builder">Build Your Plan</Link>
              </Button>
            )}

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
              <Link
                href="/feeding-guide"
                className="block text-sm font-medium hover:text-primary transition-colors pl-4"
              >
                Feeding Guide
              </Link>
              <Link href="/calculators" className="block text-sm font-medium hover:text-primary transition-colors">
                Calculators
              </Link>
              {isAuthenticated && (
                <Link href="/dashboard" className="block text-sm font-medium hover:text-primary transition-colors">
                  Dashboard
                </Link>
              )}
              {isAuthenticated && user?.roles?.includes('delivery_driver') && (
                <Link href="/delivery" className="block text-sm font-medium hover:text-primary transition-colors text-blue-600">
                  Delivery
                </Link>
              )}
              {isAuthenticated && user?.isAdmin && (
                <Link href="/admin" className="block text-sm font-medium hover:text-primary transition-colors text-purple-600">
                  Admin
                </Link>
              )}

              {isAuthenticated ? (
                hasSubscription ? (
                  <Button className="w-full" onClick={() => setShowSubscriptionModal(true)}>
                    Manage Subscription
                  </Button>
                ) : (
                  <Button asChild className="w-full">
                    <Link href="/plan-builder">Build Your Plan</Link>
                  </Button>
                )
              ) : (
                <Button asChild className="w-full">
                  <Link href="/plan-builder">Build Your Plan</Link>
                </Button>
              )}

              <div className="pt-4 border-t space-y-2">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <User className="h-4 w-4" />
                      {user?.email}
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
                    <Button variant="ghost" onClick={handleForceClear} className="w-full justify-start text-orange-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Force Clear Auth
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

      <DogSelectionModal
        open={openDogModal}
        onOpenChange={setOpenDogModal}
        onSelectDog={() => {
          setOpenDogModal(false)
          router.push("/plan-builder")
        }}
      />

      <SubscriptionManagementModal open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal} />
    </>
  )
}
