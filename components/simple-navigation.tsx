"use client"

import Link from "next/link"
import { useState } from "react"

interface SimpleNavigationProps {
  currentPage?: "coming-soon" | "early-access" | "about-us" | "recipes"
}

export function SimpleNavigation({ currentPage }: SimpleNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <img src="/nouripet-logo.svg" alt="NouriPet Logo" className="h-8 w-8" />
            <span className="font-serif text-xl font-bold text-black">NouriPet</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                currentPage === "coming-soon"
                  ? "text-green-600 border-b-2 border-green-600 pb-1"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Coming Soon
            </Link>
            <Link
              href="/early-access"
              className={`text-sm font-medium transition-colors ${
                currentPage === "early-access"
                  ? "text-green-600 border-b-2 border-green-600 pb-1"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Early Access
            </Link>
            <Link
              href="/recipes-standalone"
              className={`text-sm font-medium transition-colors ${
                currentPage === "recipes"
                  ? "text-green-600 border-b-2 border-green-600 pb-1"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Recipes
            </Link>
            <Link
              href="/about-us"
              className={`text-sm font-medium transition-colors ${
                currentPage === "about-us"
                  ? "text-green-600 border-b-2 border-green-600 pb-1"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              About Us
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900"
              aria-label="Toggle mobile menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                className={`text-sm font-medium transition-colors ${
                  currentPage === "coming-soon" ? "text-green-600 font-semibold" : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Coming Soon
              </Link>
              <Link
                href="/early-access"
                className={`text-sm font-medium transition-colors ${
                  currentPage === "early-access" ? "text-green-600 font-semibold" : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Early Access
              </Link>
              <Link
                href="/recipes-standalone"
                className={`text-sm font-medium transition-colors ${
                  currentPage === "recipes" ? "text-green-600 font-semibold" : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Recipes
              </Link>
              <Link
                href="/about-us"
                className={`text-sm font-medium transition-colors ${
                  currentPage === "about-us" ? "text-green-600 font-semibold" : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About Us
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
