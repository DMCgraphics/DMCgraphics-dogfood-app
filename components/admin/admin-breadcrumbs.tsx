"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

// Map of route segments to human-readable labels
const segmentLabels: Record<string, string> = {
  admin: "Admin",
  users: "Users",
  orders: "Orders",
  sales: "Sales",
  leads: "Leads",
  "event-signups": "Event Signups",
  "incomplete-orders": "Incomplete Orders",
  fulfillment: "Fulfillment",
  deliveries: "Deliveries",
  drivers: "Drivers",
  stripe: "Stripe Actions",
  invitations: "Invitations",
  "ai-monitoring": "AI Monitoring",
  notifications: "Notifications",
  new: "New",
}

interface BreadcrumbItem {
  label: string
  href: string
}

export function AdminBreadcrumbs() {
  const pathname = usePathname()

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split("/").filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    // Skip if we're on the admin home page
    if (segments.length <= 1) {
      return []
    }

    let currentPath = ""
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`

      // Skip the 'admin' segment in display
      if (segment === "admin") {
        return
      }

      // Check if segment is a UUID (detail pages)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)

      breadcrumbs.push({
        label: isUuid ? "Details" : segmentLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        href: currentPath,
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  // Don't render if there are no breadcrumbs
  if (breadcrumbs.length === 0) {
    return null
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-600 mb-4">
      <Link
        href="/admin"
        className="flex items-center hover:text-purple-600 transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1

        return (
          <div key={crumb.href} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
            {isLast ? (
              <span className="font-medium text-gray-900">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-purple-600 transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
