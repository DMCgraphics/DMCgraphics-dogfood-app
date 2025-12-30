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
<<<<<<< Updated upstream
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
=======
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Admin Header */}
      <header className="bg-gray-900 dark:bg-gray-900 text-white shadow-lg border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <LayoutDashboard className="h-8 w-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">NouriPet Admin</h1>
                <p className="text-sm text-gray-300">Management Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">{adminUser.email}</span>
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-white"
>>>>>>> Stashed changes
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Exit</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

<<<<<<< Updated upstream
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex gap-4 md:gap-6">
          {/* Desktop Sidebar - Hidden on mobile */}
          <AdminSidebar />
=======
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <aside className="col-span-12 lg:col-span-3">
            <nav className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 space-y-2 border border-gray-200 dark:border-gray-800">
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-200"
              >
                <LayoutDashboard className="h-5 w-5" />
                <span className="font-medium">Dashboard</span>
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-200"
              >
                <Users className="h-5 w-5" />
                <span className="font-medium">Users</span>
              </Link>
              <Link
                href="/admin/orders"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-200"
              >
                <Package className="h-5 w-5" />
                <span className="font-medium">Orders</span>
              </Link>
              <Link
                href="/admin/fulfillment"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-200"
              >
                <ClipboardList className="h-5 w-5" />
                <span className="font-medium">Fulfillment</span>
              </Link>
              <Link
                href="/admin/deliveries"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-200"
              >
                <Truck className="h-5 w-5" />
                <span className="font-medium">Deliveries</span>
              </Link>
              <Link
                href="/admin/drivers"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-200"
              >
                <UserCircle className="h-5 w-5" />
                <span className="font-medium">Drivers</span>
              </Link>
              <Link
                href="/admin/stripe"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-200"
              >
                <CreditCard className="h-5 w-5" />
                <span className="font-medium">Stripe Actions</span>
              </Link>
              <Link
                href="/admin/invitations"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-200"
              >
                <Mail className="h-5 w-5" />
                <span className="font-medium">Invitations</span>
              </Link>
              <Link
                href="/admin/ai-monitoring"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-200"
              >
                <Brain className="h-5 w-5" />
                <span className="font-medium">AI Monitoring</span>
              </Link>
            </nav>
          </aside>
>>>>>>> Stashed changes

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
