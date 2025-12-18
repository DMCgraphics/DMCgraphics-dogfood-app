import { redirect } from "next/navigation"
import { getAdminUser } from "@/lib/admin/auth"
import Link from "next/link"
import { LayoutDashboard, LogOut } from "lucide-react"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs"

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
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header - Compact on mobile */}
      <header className="bg-gray-900 text-white shadow-lg border-b border-gray-800">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <LayoutDashboard className="h-6 w-6 md:h-8 md:w-8 text-purple-400" />
              <div>
                <h1 className="text-lg md:text-2xl font-bold">
                  <span className="hidden sm:inline">NouriPet </span>Admin
                </h1>
                <p className="text-xs md:text-sm text-gray-400 hidden sm:block">Management Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <NotificationBell portalType="admin" />
              <span className="text-xs md:text-sm text-gray-400 hidden md:inline">{adminUser.email}</span>
              <Link
                href="/"
                className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-xs md:text-sm"
              >
                <LogOut className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Exit Admin</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="flex gap-4 md:gap-6">
          {/* Collapsible Sidebar - Hidden on mobile, shown as drawer */}
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
