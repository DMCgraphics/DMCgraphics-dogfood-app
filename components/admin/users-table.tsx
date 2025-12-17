"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { ExternalLink, Mail, Calendar, Shield, ChevronLeft, ChevronRight, Users, Truck, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface UsersTableProps {
  users: any[]
}

export function UsersTable({ users }: UsersTableProps) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)
  const [filters, setFilters] = useState({
    role: "all",
    status: "all",
    dateFrom: "",
    dateTo: "",
    search: ""
  })

  const itemsPerPage = 10

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Role filter
      if (filters.role === "admin" && !user.is_admin) return false
      if (filters.role === "user" && user.is_admin) return false

      // Status filter
      const activeSubscriptions = user.subscriptions?.filter((sub: any) => sub.status === "active") || []
      const hasActiveSubscription = activeSubscriptions.length > 0
      const hasAnySubscription = (user.subscriptions?.length || 0) > 0

      if (filters.status === "active" && !hasActiveSubscription) return false
      if (filters.status === "inactive" && (hasActiveSubscription || !hasAnySubscription)) return false
      if (filters.status === "new" && hasAnySubscription) return false

      // Date from filter
      if (filters.dateFrom) {
        const userDate = new Date(user.created_at)
        const fromDate = new Date(filters.dateFrom)
        if (userDate < fromDate) return false
      }

      // Date to filter
      if (filters.dateTo) {
        const userDate = new Date(user.created_at)
        const toDate = new Date(filters.dateTo)
        toDate.setHours(23, 59, 59)
        if (userDate > toDate) return false
      }

      // Search filter (name or email/id)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const nameMatch = user.full_name?.toLowerCase().includes(searchLower)
        const idMatch = user.id?.toLowerCase().includes(searchLower)
        if (!nameMatch && !idMatch) return false
      }

      return true
    })
  }, [users, filters])

  // Paginate
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setFilters({
      role: "all",
      status: "all",
      dateFrom: "",
      dateTo: "",
      search: ""
    })
    setCurrentPage(1)
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(paginatedUsers.map(u => u.id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return

    if (!confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)? This action cannot be undone.`)) {
      return
    }

    setDeleting(true)

    try {
      const response = await fetch('/api/admin/users/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds: selectedUsers }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete users')
      }

      const result = await response.json()
      alert(result.message)

      // Clear selection and refresh
      setSelectedUsers([])
      router.refresh()
    } catch (error) {
      console.error('Error deleting users:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete users')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteSingle = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return
    }

    setDeleting(true)

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete user')
      }

      router.refresh()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter users by criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Name or email..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={filters.role} onValueChange={(value) => handleFilterChange("role", value)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active Subscription</SelectItem>
                  <SelectItem value="inactive">Inactive Subscription</SelectItem>
                  <SelectItem value="new">New User (No Subscription)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFrom">Joined From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">Joined To</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4">
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions */}
      {selectedUsers.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm font-medium">
                  {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUsers([])}
                >
                  Clear Selection
                </Button>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? 'Deleting...' : `Delete Selected (${selectedUsers.length})`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {paginatedUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <Label className="text-sm text-gray-600 cursor-pointer" onClick={toggleSelectAll}>
                Select all on page
              </Label>
            </div>
          )}
          <p className="text-sm text-gray-600">
            Showing {paginatedUsers.length} of {filteredUsers.length} users
            {filteredUsers.length !== users.length && ` (filtered from ${users.length} total)`}
          </p>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Users grid */}
      <div className="grid gap-4">
        {paginatedUsers.map((user) => {
          const activeSubscriptions = user.subscriptions?.filter(
            (sub: any) => sub.status === "active"
          ) || []
          const totalSubscriptions = user.subscriptions?.length || 0
          const totalDogs = user.dogs?.length || 0

          return (
            <Card key={user.id} className={selectedUsers.includes(user.id) ? 'border-blue-500 bg-blue-50/50' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => toggleUserSelection(user.id)}
                      className="mt-1"
                    />
                    <div className="space-y-1 flex-1">
                      <CardTitle className="flex items-center gap-2 flex-wrap">
                        {user.full_name || "No name"}
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((role: string) => (
                          role === 'admin' ? (
                            <Badge key={role} variant="secondary" className="bg-purple-100 text-purple-800">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          ) : role === 'delivery_driver' ? (
                            <Badge key={role} variant="secondary" className="bg-blue-100 text-blue-800">
                              <Truck className="h-3 w-3 mr-1" />
                              Delivery Driver
                            </Badge>
                          ) : null
                        ))
                      ) : user.is_admin ? (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      ) : null}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.id}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="inline-flex"
                  >
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSingle(user.id, user.full_name || user.id)}
                    disabled={deleting}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Subscriptions</div>
                    <div className="text-2xl font-bold">
                      {activeSubscriptions.length}
                      <span className="text-sm text-gray-600 font-normal">
                        {" "}/ {totalSubscriptions}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">active / total</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Dogs</div>
                    <div className="text-2xl font-bold">{totalDogs}</div>
                    <div className="text-xs text-gray-500">registered</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <div className="mt-1">
                      {activeSubscriptions.length > 0 ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : totalSubscriptions > 0 ? (
                        <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800">New</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {paginatedUsers.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No users found matching your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
