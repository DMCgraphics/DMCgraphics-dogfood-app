"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { User, LogOut, ChevronDown } from "lucide-react"

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { user, isAuthenticated, logout } = useAuth()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  const handleLogout = async () => {
    setOpen(false)
    await logout()
    window.location.href = "/"
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-background hover:bg-muted transition-colors duration-200 rounded-lg border border-border focus:outline-none focus:ring-0"
      >
        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
          <User className="h-4 w-4 text-primary" />
        </div>
        <span className="hidden sm:block font-medium">{user.email}</span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-lg ring-1 ring-black/5 z-[1000] overflow-hidden">
          <div className="py-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-popover-foreground hover:bg-muted transition-colors duration-150"
              onClick={() => setOpen(false)}
            >
              <div className="flex items-center justify-center w-6 h-6 bg-primary/10 rounded-md">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
              Dashboard
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-popover-foreground hover:bg-muted transition-colors duration-150"
              onClick={() => setOpen(false)}
            >
              <div className="flex items-center justify-center w-6 h-6 bg-secondary/20 rounded-md">
                <User className="h-3.5 w-3.5 text-secondary-foreground" />
              </div>
              Profile Settings
            </Link>
            <Link
              href="/orders"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-popover-foreground hover:bg-muted transition-colors duration-150"
              onClick={() => setOpen(false)}
            >
              <div className="flex items-center justify-center w-6 h-6 bg-accent/20 rounded-md">
                <User className="h-3.5 w-3.5 text-accent-foreground" />
              </div>
              Order History
            </Link>
            {user?.isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors duration-150"
                onClick={() => setOpen(false)}
              >
                <div className="flex items-center justify-center w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-md">
                  <User className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                Admin
              </Link>
            )}
            <div className="my-2 h-px bg-border"></div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors duration-150"
            >
              <div className="flex items-center justify-center w-6 h-6 bg-destructive/10 rounded-md">
                <LogOut className="h-3.5 w-3.5 text-destructive" />
              </div>
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
