import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import type { Notification, CreateNotificationParams, PortalType } from './types'

// Helper to get Supabase client (works in both webhook and server component context)
async function getClient() {
  // If we have environment variables, use admin client (for webhooks)
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }
  // Otherwise use server client (for server components)
  return await createServerClient()
}

export class NotificationService {
  // Create a single notification
  static async create(params: CreateNotificationParams): Promise<Notification | null> {
    const supabase = await getClient()

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        portal_type: params.portalType,
        notification_type: params.notificationType,
        title: params.title,
        message: params.message,
        link: params.link || null,
        priority: params.priority || 'normal',
        metadata: params.metadata || {}
      })
      .select()
      .single()

    if (error) {
      console.error('[NotificationService] Error creating notification:', error)
      return null
    }

    return data as Notification
  }

  // Create multiple notifications at once
  static async createBulk(notifications: CreateNotificationParams[]): Promise<Notification[]> {
    const supabase = await getClient()

    const { data, error } = await supabase
      .from('notifications')
      .insert(
        notifications.map(n => ({
          user_id: n.userId,
          portal_type: n.portalType,
          notification_type: n.notificationType,
          title: n.title,
          message: n.message,
          link: n.link || null,
          priority: n.priority || 'normal',
          metadata: n.metadata || {}
        }))
      )
      .select()

    if (error) {
      console.error('[NotificationService] Error creating bulk notifications:', error)
      return []
    }

    return data as Notification[]
  }

  // Get notifications for a specific user and portal
  static async getForUser(
    userId: string,
    portalType: PortalType,
    options?: {
      limit?: number
      unreadOnly?: boolean
    }
  ): Promise<{ notifications: Notification[]; unreadCount: number }> {
    const supabase = await getClient()

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('portal_type', portalType)
      .order('created_at', { ascending: false })

    if (options?.unreadOnly) {
      query = query.eq('read', false)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('[NotificationService] Error fetching notifications:', error)
      return { notifications: [], unreadCount: 0 }
    }

    // Get unread count
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('portal_type', portalType)
      .eq('read', false)

    return {
      notifications: data as Notification[],
      unreadCount: count || 0
    }
  }

  // Get unread count for a user
  static async getUnreadCount(userId: string, portalType: PortalType): Promise<number> {
    const supabase = await getClient()

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('portal_type', portalType)
      .eq('read', false)

    if (error) {
      console.error('[NotificationService] Error getting unread count:', error)
      return 0
    }

    return count || 0
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<boolean> {
    const supabase = await getClient()

    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)

    if (error) {
      console.error('[NotificationService] Error marking notification as read:', error)
      return false
    }

    return true
  }

  // Mark all notifications as read for a user/portal
  static async markAllAsRead(userId: string, portalType: PortalType): Promise<boolean> {
    const supabase = await getClient()

    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('portal_type', portalType)
      .eq('read', false)

    if (error) {
      console.error('[NotificationService] Error marking all as read:', error)
      return false
    }

    return true
  }

  // Delete a notification
  static async delete(notificationId: string): Promise<boolean> {
    const supabase = await getClient()

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      console.error('[NotificationService] Error deleting notification:', error)
      return false
    }

    return true
  }
}
