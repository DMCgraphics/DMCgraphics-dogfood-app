"use client"

import { useEffect, useState } from "react"
import { Bell, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { NotificationIcon } from "@/components/notifications/notification-icon"

type PortalType = 'admin' | 'sales' | 'delivery' | 'customer'

interface Notification {
  id: string
  user_id: string
  portal_type: PortalType
  notification_type: string
  title: string
  message: string
  link: string | null
  priority: 'low' | 'normal' | 'high' | 'urgent'
  read: boolean
  read_at: string | null
  created_at: string
}

interface NotificationBellProps {
  portalType: PortalType
  className?: string
}

export function NotificationBell({ portalType, className }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?portal=${portalType}&limit=5`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [portalType])

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [portalType])

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      })

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch(`/api/notifications/read-all?portal=${portalType}`, {
        method: 'PATCH',
      })

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  // Format time ago
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

  // Render notification item (used in both mobile and desktop)
  const renderNotificationItem = (notification: Notification, isMobile = false) => {
    const content = (
      <div className="flex items-start gap-3 w-full">
        <NotificationIcon
          notificationType={notification.notification_type}
          className={isMobile ? "w-10 h-10" : "w-9 h-9"}
          iconSize={isMobile ? "h-5 w-5" : "h-4 w-4"}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-medium line-clamp-1 text-sm text-gray-900 dark:text-gray-100">
              {notification.title}
            </p>
            {!notification.read && (
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">
            {formatTimeAgo(notification.created_at)}
          </p>
        </div>
      </div>
    )

    const handleClick = () => {
      if (!notification.read) {
        handleMarkAsRead(notification.id)
      }
      if (isMobile) {
        setMobileOpen(false)
      }
    }

    if (notification.link) {
      return (
        <Link
          key={notification.id}
          href={notification.link}
          onClick={handleClick}
          className={cn(
            "block px-4 py-3 transition-all",
            isMobile ? "hover:bg-purple-50 dark:hover:bg-purple-950/30 active:bg-purple-100 dark:active:bg-purple-900/30" : "hover:bg-gray-50 dark:hover:bg-gray-800",
            !notification.read && "bg-blue-50/50 dark:bg-blue-950/30"
          )}
        >
          {content}
        </Link>
      )
    }

    return (
      <div
        key={notification.id}
        onClick={handleClick}
        className={cn(
          "block px-4 py-3 cursor-pointer transition-all",
          isMobile ? "hover:bg-purple-50 dark:hover:bg-purple-950/30 active:bg-purple-100 dark:active:bg-purple-900/30" : "hover:bg-gray-50 dark:hover:bg-gray-800",
          !notification.read && "bg-blue-50/50 dark:bg-blue-950/30"
        )}
      >
        {content}
      </div>
    )
  }

  const bellButton = (
    <button
      className={cn(
        "relative inline-flex items-center justify-center rounded-lg text-white hover:bg-white/10 p-2 transition-all",
        className
      )}
      aria-label={`${unreadCount} unread notifications`}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-red-500 to-pink-500 border-2 border-white animate-pulse"
          variant="destructive"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </button>
  )

  return (
    <>
      {/* Desktop Dropdown */}
      <div className="hidden md:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {bellButton}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="bottom"
            className="w-96 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-purple-100 dark:border-purple-900 shadow-xl"
            sideOffset={12}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-b dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="h-auto px-2 py-1 text-xs hover:bg-white/60"
                >
                  Mark all read
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2"></div>
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.map((notification) => renderNotificationItem(notification, false))}
              </div>
            )}

            <div className="border-t dark:border-gray-800 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
              <Link
                href={`/${portalType}/notifications`}
                className="block w-full text-center text-sm py-3 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
              >
                View all notifications
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile Sheet */}
      <div className="md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            {bellButton}
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-96 p-0">
            <SheetHeader className="px-4 py-4 border-b dark:border-gray-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-lg">Notifications</SheetTitle>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="h-auto px-3 py-1.5 text-xs"
                  >
                    Mark all read
                  </Button>
                )}
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-16 text-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-3"></div>
                  <p>Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-16 text-center text-sm text-gray-500 dark:text-gray-400">
                  <Bell className="h-16 w-16 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-base mb-1">No notifications yet</p>
                  <p className="text-xs">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => renderNotificationItem(notification, true))}
                </div>
              )}
            </div>

            <div className="border-t dark:border-gray-800 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 p-4">
              <Link
                href={`/${portalType}/notifications`}
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
              >
                View all notifications
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
