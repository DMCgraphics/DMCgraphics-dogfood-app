"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Search, UserCheck, Package, Truck, CheckCircle, ChevronRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useOrderTracking } from "@/hooks/use-order-tracking"

interface DeliveryStatusBannerProps {
  orderId: string
  sessionId?: string | null
  className?: string
}

const STAGE_CONFIG = {
  looking_for_driver: {
    label: "Looking for a driver",
    icon: Search,
    color: "bg-yellow-500",
    textColor: "text-yellow-900 dark:text-yellow-100",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    borderColor: "border-yellow-200 dark:border-yellow-800",
  },
  driver_assigned: {
    label: "Driver assigned",
    icon: UserCheck,
    color: "bg-blue-500",
    textColor: "text-blue-900 dark:text-blue-100",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  preparing: {
    label: "Preparing your order",
    icon: Package,
    color: "bg-purple-500",
    textColor: "text-purple-900 dark:text-purple-100",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  out_for_delivery: {
    label: "Out for delivery",
    icon: Truck,
    color: "bg-green-500",
    textColor: "text-green-900 dark:text-green-100",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle,
    color: "bg-green-600",
    textColor: "text-green-900 dark:text-green-100",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
  },
  pending: {
    label: "Order confirmed",
    icon: Clock,
    color: "bg-gray-500",
    textColor: "text-gray-900 dark:text-gray-100",
    bgColor: "bg-gray-50 dark:bg-gray-950/30",
    borderColor: "border-gray-200 dark:border-gray-800",
  },
}

export function DeliveryStatusBanner({ orderId, sessionId, className }: DeliveryStatusBannerProps) {
  const { order, events, isConnected, isLoading } = useOrderTracking(orderId, sessionId)
  const [isVisible, setIsVisible] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)

  // Auto-hide after delivery
  useEffect(() => {
    if (order?.fulfillment_status === "delivered") {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 10000) // Hide after 10 seconds
      return () => clearTimeout(timer)
    }
  }, [order?.fulfillment_status])

  // Track scroll position for compact mode
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsScrolled(scrollPosition > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!isVisible || isLoading || !order) {
    return null
  }

  const status = order.fulfillment_status || "pending"
  const config = STAGE_CONFIG[status as keyof typeof STAGE_CONFIG] || STAGE_CONFIG.pending
  const Icon = config.icon

  // Calculate progress percentage
  const stages = ["looking_for_driver", "driver_assigned", "preparing", "out_for_delivery", "delivered"]
  const currentIndex = stages.indexOf(status)
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / stages.length) * 100 : 0

  return (
    <div
      className={cn(
        "sticky top-16 z-40 border-b shadow-sm animate-in slide-in-from-top duration-300 transition-all",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div className="container">
        <div className={cn(
          "flex items-center justify-between gap-4 transition-all duration-300",
          isScrolled ? "py-2" : "py-3"
        )}>
          {/* Status Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Icon - Hidden when scrolled */}
            <div className={cn(
              "flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300",
              config.color,
              isScrolled ? "w-0 h-0 opacity-0 overflow-hidden" : "w-10 h-10 opacity-100"
            )}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className={cn("font-semibold text-sm", config.textColor)}>{config.label}</p>
                {isConnected && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              {/* Subtext - Hidden when scrolled */}
              <div className={cn(
                "overflow-hidden transition-all duration-300",
                isScrolled ? "max-h-0 opacity-0" : "max-h-20 opacity-100"
              )}>
                {order.estimated_delivery_window && status !== "delivered" && (
                  <p className="text-xs text-muted-foreground truncate">
                    Estimated: {order.estimated_delivery_window}
                  </p>
                )}
                {order.driver_name && ["driver_assigned", "preparing", "out_for_delivery"].includes(status) && (
                  <p className="text-xs text-muted-foreground truncate">Driver: {order.driver_name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar (mobile hidden) */}
          <div className="hidden sm:flex items-center gap-3 flex-1 max-w-xs">
            <div className="flex-1 h-2 bg-white/50 dark:bg-black/30 rounded-full overflow-hidden">
              <div
                className={cn("h-full transition-all duration-500", config.color)}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              {currentIndex + 1}/{stages.length}
            </span>
          </div>

          {/* View Details Button */}
          <Button variant="ghost" size="sm" asChild className={cn("flex-shrink-0", config.textColor)}>
            <Link href={`/orders/${orderId}/track`}>
              View Details
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        {/* Mobile Progress Bar - Hidden when scrolled */}
        <div className={cn(
          "sm:hidden overflow-hidden transition-all duration-300",
          isScrolled ? "max-h-0 pb-0 opacity-0" : "max-h-10 pb-2 opacity-100"
        )}>
          <div className="h-1.5 bg-white/50 dark:bg-black/30 rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all duration-500", config.color)}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
