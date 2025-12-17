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
      {/* Admin Header - NOT STICKY */}
      <header className="bg-gray-900 text-white shadow-lg border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <LayoutDashboard className="h-8 w-8 text-purple-400" />
              <div>
                <h1 className="text-2xl font-bold">NouriPet Admin</h1>
                <p className="text-sm text-gray-400">Management Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell portalType="admin" />
              <span className="text-sm text-gray-400">{adminUser.email}</span>
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Exit Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Collapsible Sidebar */}
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
