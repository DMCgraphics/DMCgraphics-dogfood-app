"use client"

import { useEffect, useState } from "react"

export function LoadingAnimation() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 1500) // Show loading for 1.5 seconds

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="relative">
          <img
            src="/nouripet-loading-logo.svg"
            alt="NouriPet Loading"
            className="h-24 w-24 mx-auto animate-pulse"
            style={{
              animation: "logoAnimation 2s ease-in-out infinite",
            }}
          />
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-green-400/20 animate-ping"></div>
        </div>

        <div className="mt-6 space-y-2">
          <h2 className="text-2xl font-serif font-bold text-gray-900 animate-fade-in">NouriPet</h2>
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes logoAnimation {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(5deg); }
        }
        
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
