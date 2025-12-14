import { redirect } from "next/navigation"
import { getAdminUser } from "@/lib/admin/auth"
import Link from "next/link"
import {
  LayoutDashboard,
  Users,
  Package,
  Truck,
  CreditCard,
  Settings,
  LogOut,
  Mail,
  ClipboardList,
  UserCircle,
  Brain
} from "lucide-react"

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
      {/* Admin Header */}
      <header className="bg-gray-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <LayoutDashboard className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">NouriPet Admin</h1>
                <p className="text-sm text-gray-400">Management Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
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
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <aside className="col-span-12 lg:col-span-3">
            <nav className="bg-white rounded-lg shadow-md p-4 space-y-2">
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <LayoutDashboard className="h-5 w-5" />
                <span className="font-medium">Dashboard</span>
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Users className="h-5 w-5" />
                <span className="font-medium">Users</span>
              </Link>
              <Link
                href="/admin/orders"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Package className="h-5 w-5" />
                <span className="font-medium">Orders</span>
              </Link>
              <Link
                href="/admin/fulfillment"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ClipboardList className="h-5 w-5" />
                <span className="font-medium">Fulfillment</span>
              </Link>
              <Link
                href="/admin/deliveries"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Truck className="h-5 w-5" />
                <span className="font-medium">Deliveries</span>
              </Link>
              <Link
                href="/admin/drivers"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <UserCircle className="h-5 w-5" />
                <span className="font-medium">Drivers</span>
              </Link>
              <Link
                href="/admin/stripe"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <CreditCard className="h-5 w-5" />
                <span className="font-medium">Stripe Actions</span>
              </Link>
              <Link
                href="/admin/invitations"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Mail className="h-5 w-5" />
                <span className="font-medium">Invitations</span>
              </Link>
              <Link
                href="/admin/ai-monitoring"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Brain className="h-5 w-5" />
                <span className="font-medium">AI Monitoring</span>
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="col-span-12 lg:col-span-9">{children}</main>
        </div>
      </div>
    </div>
  )
}
