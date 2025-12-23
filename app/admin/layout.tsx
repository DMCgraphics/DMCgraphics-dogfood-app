import { redirect } from "next/navigation"
import { getAdminUser } from "@/lib/admin/auth"
import Link from "next/link"
import { LayoutDashboard, LogOut } from "lucide-react"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs"
import { AdminMobileMenu } from "@/components/admin/admin-mobile-menu"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const adminUser = await getAdminUser()

  if (!adminUser) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Modern Admin Header - Sticky */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 dark:from-gray-950 dark:via-purple-950 dark:to-gray-950 text-white shadow-xl backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <AdminMobileMenu />

              <LayoutDashboard className="h-5 w-5 md:h-6 md:w-6 text-purple-300" />
              <div>
                <h1 className="text-base md:text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  <span className="hidden sm:inline">NouriPet </span>Admin
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <NotificationBell portalType="admin" />
              <span className="text-xs text-gray-300 hidden lg:inline">{adminUser.email}</span>
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-xs md:text-sm backdrop-blur-sm border border-white/10"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Exit</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex gap-4 md:gap-6">
          {/* Desktop Sidebar - Hidden on mobile */}
          <AdminSidebar />

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <AdminBreadcrumbs />
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
