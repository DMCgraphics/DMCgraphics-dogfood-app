"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight, Menu } from "lucide-react"
import {
  LayoutDashboard,
  Users,
  Package,
  TrendingUp,
  ClipboardList,
  Truck,
  UserCircle,
  CreditCard,
  Mail,
  Brain,
  Bell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navigationSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    title: "Customer Management",
    items: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Orders", href: "/admin/orders", icon: Package },
    ],
  },
  {
    title: "Sales & Marketing",
    items: [
      { label: "Sales Dashboard", href: "/admin/sales", icon: TrendingUp },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Fulfillment", href: "/admin/fulfillment", icon: ClipboardList },
      { label: "Deliveries", href: "/admin/deliveries", icon: Truck },
      { label: "Drivers", href: "/admin/drivers", icon: UserCircle },
    ],
  },
  {
    title: "Financial",
    items: [
      { label: "Stripe Actions", href: "/admin/stripe", icon: CreditCard },
      { label: "Invitations", href: "/admin/invitations", icon: Mail },
    ],
  },
  {
    title: "System",
    items: [
      { label: "AI Monitoring", href: "/admin/ai-monitoring", icon: Brain },
      { label: "Notifications", href: "/admin/notifications", icon: Bell },
    ],
  },
]

export function AdminMobileMenu() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  // Auto-expand section containing current route
  useEffect(() => {
    const currentSection = navigationSections.find(section =>
      section.items.some(item => pathname === item.href || pathname.startsWith(item.href + "/"))
    )
    if (currentSection) {
      setExpandedSections(new Set([currentSection.title]))
    }
  }, [pathname])

  // Toggle section expansion
  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionTitle)) {
        next.delete(sectionTitle)
      } else {
        next.add(sectionTitle)
      }
      return next
    })
  }

  return (
    <div className="md:hidden">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white hover:bg-white/10"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-4 border-b bg-gradient-to-r from-purple-50 to-white">
            <SheetTitle className="text-left">Navigation</SheetTitle>
          </SheetHeader>
          <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-80px)]">
            {navigationSections.map((section) => {
              const isExpanded = expandedSections.has(section.title)
              const hasActiveItem = section.items.some(
                item => pathname === item.href || pathname.startsWith(item.href + "/")
              )

              return (
                <div key={section.title}>
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section.title)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors rounded-md hover:bg-gray-50",
                      hasActiveItem && "text-purple-600"
                    )}
                  >
                    <span>{section.title}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </button>

                  {/* Section Items */}
                  {isExpanded && (
                    <div className="space-y-1 mt-1">
                      {section.items.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group relative",
                              isActive
                                ? "bg-purple-50 text-purple-700 font-medium"
                                : "hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-5 w-5 flex-shrink-0",
                                isActive ? "text-purple-600" : "text-gray-400 group-hover:text-gray-600"
                              )}
                            />
                            <span className="flex-1 text-sm">{item.label}</span>
                            {item.badge && (
                              <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
