"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Trash2, RefreshCw, Search, Filter, ExternalLink } from "lucide-react"
import Link from "next/link"
import { PRIORITY_BG_COLORS, PRIORITY_COLORS } from "@/lib/notifications/types"
import { NotificationIcon } from "@/components/notifications/notification-icon"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  user_id: string
  portal_type: 'admin' | 'sales' | 'delivery' | 'customer'
  notification_type: string
  title: string
  message: string
  link: string | null
  priority: 'low' | 'normal' | 'high' | 'urgent'
  read: boolean
  read_at: string | null
  metadata: Record<string, any>
  created_at: string
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        portal: 'admin',
        limit: '100',
        unread: filter === 'unread' ? 'true' : 'false'
      })

      const response = await fetch(`/api/notifications?${params}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      })
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n)
        )
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all?portal=admin', {
        method: 'PATCH',
      })
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
        )
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id))
        setSelectedIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return

    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          fetch(`/api/notifications/${id}`, { method: 'DELETE' })
        )
      )
      setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)))
      setSelectedIds(new Set())
    } catch (error) {
      console.error('Error bulk deleting:', error)
    }
  }

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredNotifications.map(n => n.id)))
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  // Apply filters
  const filteredNotifications = notifications
    .filter(n => {
      if (priorityFilter !== 'all' && n.priority !== priorityFilter) return false
      if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !n.message.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchNotifications} className="flex-1 sm:flex-none">
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {unreadCount > 0 && (
            <Button size="sm" onClick={handleMarkAllAsRead} className="flex-1 sm:flex-none">
              <CheckCircle2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Mark All Read</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 md:pt-6">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 md:flex md:gap-4">
              <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-blue-900">
                {selectedIds.size} selected
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="flex-1 sm:flex-none"
                >
                  <Trash2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Delete Selected</span>
                  <span className="sm:hidden">Delete</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                  className="flex-1 sm:flex-none"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-muted-foreground">Loading notifications...</p>
          </CardContent>
        </Card>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-lg font-medium mb-2">No notifications found</p>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try adjusting your search' : 'Check back later for updates'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.length > 0 && (
            <div className="flex items-center gap-2 px-4">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredNotifications.length}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm text-muted-foreground">
                Select all
              </span>
            </div>
          )}

          {filteredNotifications.map((notification) => (
            <Card key={notification.id} className={cn(
              "group hover:shadow-md transition-all duration-200 border",
              !notification.read && "bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-blue-200"
            )}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start gap-3 md:gap-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(notification.id)}
                    onChange={() => toggleSelection(notification.id)}
                    className="mt-2 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 flex-shrink-0"
                  />

                  <NotificationIcon
                    notificationType={notification.notification_type}
                    className="w-10 h-10 md:w-12 md:h-12"
                    iconSize="h-5 w-5 md:h-6 md:w-6"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-base md:text-lg text-gray-900">
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <span className="flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-purple-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                              </span>
                            )}
                          </div>
                          <Badge
                            className={cn(
                              PRIORITY_BG_COLORS[notification.priority],
                              PRIORITY_COLORS[notification.priority],
                              "capitalize text-xs md:hidden flex-shrink-0 font-medium"
                            )}
                          >
                            {notification.priority}
                          </Badge>
                        </div>
                        <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                          {notification.message}
                        </p>
                      </div>

                      <Badge
                        className={cn(
                          PRIORITY_BG_COLORS[notification.priority],
                          PRIORITY_COLORS[notification.priority],
                          "capitalize hidden md:inline-flex flex-shrink-0 font-medium"
                        )}
                      >
                        {notification.priority}
                      </Badge>
                    </div>

                    <div className="flex flex-col gap-3 mt-3">
                      <span className="text-xs md:text-sm text-gray-500 font-medium">
                        {formatTimeAgo(notification.created_at)}
                      </span>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        {notification.link && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="w-full sm:w-auto justify-center border-purple-200 hover:bg-purple-50 hover:border-purple-300 text-purple-700"
                          >
                            <Link href={notification.link} className="flex items-center gap-2">
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>View Details</span>
                            </Link>
                          </Button>
                        )}
                        {!notification.read && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="w-full sm:w-auto justify-center border-green-200 hover:bg-green-50 hover:border-green-300 text-green-700"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 sm:mr-2" />
                            <span>Mark Read</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                          className="w-full sm:w-auto justify-center border-red-200 hover:bg-red-50 hover:border-red-300 text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:mr-2" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
