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
  ChevronLeft,
  ChevronRight as ChevronRightCollapse,
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

export function AdminSidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [mobileOpen, setMobileOpen] = useState(false)

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("admin-sidebar-collapsed")
    if (saved) {
      setIsCollapsed(JSON.parse(saved))
    }

    // Auto-expand section containing current route
    const currentSection = navigationSections.find(section =>
      section.items.some(item => pathname === item.href || pathname.startsWith(item.href + "/"))
    )
    if (currentSection) {
      setExpandedSections(new Set([currentSection.title]))
    }
  }, [pathname])

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("admin-sidebar-collapsed", JSON.stringify(newState))
  }

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

  // Render navigation content
  const navContent = (isMobile = false) => (
    <nav className="p-4 space-y-2">
      {navigationSections.map((section) => {
        const isExpanded = expandedSections.has(section.title)
        const hasActiveItem = section.items.some(
          item => pathname === item.href || pathname.startsWith(item.href + "/")
        )

        return (
          <div key={section.title}>
            {/* Section Header */}
            {(!isCollapsed || isMobile) && (
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
            )}

            {/* Section Items */}
            {(isExpanded || (isCollapsed && !isMobile)) && (
              <div className={cn("space-y-1", (!isCollapsed || isMobile) && "mt-1")}>
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => isMobile && setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group relative",
                        isActive
                          ? "bg-purple-50 text-purple-700 font-medium"
                          : "hover:bg-gray-50 text-gray-700 hover:text-gray-900",
                        !isMobile && isCollapsed && "justify-center"
                      )}
                      title={!isMobile && isCollapsed ? item.label : undefined}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 flex-shrink-0",
                          isActive ? "text-purple-600" : "text-gray-400 group-hover:text-gray-600"
                        )}
                      />
                      {(isMobile || !isCollapsed) && (
                        <>
                          <span className="flex-1 text-sm">{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                      {!isMobile && isCollapsed && item.badge && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                          {item.badge > 9 ? "9+" : item.badge}
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
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed bottom-4 left-4 z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className="rounded-full h-14 w-14 shadow-lg"
              aria-label="Open navigation menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            {navContent(true)}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:block bg-white rounded-lg shadow-md transition-all duration-300 relative",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Collapse Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapsed}
          className="absolute -right-3 top-4 h-6 w-6 rounded-full bg-white shadow-md border p-0 z-10"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRightCollapse className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>

        {navContent(false)}
      </aside>
    </>
  )
}
