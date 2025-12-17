// Notification types and constants - safe for client-side imports
export type PortalType = 'admin' | 'sales' | 'delivery' | 'customer'
export type Priority = 'low' | 'normal' | 'high' | 'urgent'

export interface Notification {
  id: string
  user_id: string
  portal_type: PortalType
  notification_type: string
  title: string
  message: string
  link: string | null
  priority: Priority
  read: boolean
  read_at: string | null
  metadata: Record<string, any>
  created_at: string
}

export interface CreateNotificationParams {
  userId: string
  portalType: PortalType
  notificationType: string
  title: string
  message: string
  link?: string | null
  priority?: Priority
  metadata?: Record<string, any>
}

// Notification type constants
export const NOTIFICATION_TYPES = {
  // Admin notifications
  ADMIN_NEW_ORDER: 'admin_new_order',
  ADMIN_ORDER_CANCELLED: 'admin_order_cancelled',
  ADMIN_INVENTORY_LOW: 'admin_inventory_low',
  ADMIN_NEW_USER: 'admin_new_user',
  ADMIN_PAYMENT_FAILED: 'admin_payment_failed',
  ADMIN_SYSTEM_ERROR: 'admin_system_error',

  // Sales notifications
  SALES_LEAD_ASSIGNED: 'sales_lead_assigned',
  SALES_LEAD_UPDATED: 'sales_lead_updated',
  SALES_LEAD_CONVERTED: 'sales_lead_converted',
  SALES_EVENT_SIGNUP: 'sales_event_signup',
  SALES_FOLLOW_UP_DUE: 'sales_follow_up_due',
  SALES_INCOMPLETE_ORDER: 'sales_incomplete_order',

  // Delivery notifications
  DELIVERY_NEW_ASSIGNED: 'delivery_new_assigned',
  DELIVERY_ROUTE_UPDATED: 'delivery_route_updated',
  DELIVERY_CANCELLED: 'delivery_cancelled',
  DELIVERY_COMPLETED: 'delivery_completed',

  // Customer notifications
  CUSTOMER_ORDER_CONFIRMED: 'customer_order_confirmed',
  CUSTOMER_ORDER_SHIPPED: 'customer_order_shipped',
  CUSTOMER_DELIVERY_SCHEDULED: 'customer_delivery_scheduled',
  CUSTOMER_PAYMENT_ISSUE: 'customer_payment_issue',
} as const

// Notification icons (emoji/unicode)
export const NOTIFICATION_ICONS: Record<string, string> = {
  // Admin
  [NOTIFICATION_TYPES.ADMIN_NEW_ORDER]: '📦',
  [NOTIFICATION_TYPES.ADMIN_ORDER_CANCELLED]: '❌',
  [NOTIFICATION_TYPES.ADMIN_INVENTORY_LOW]: '⚠️',
  [NOTIFICATION_TYPES.ADMIN_NEW_USER]: '👤',
  [NOTIFICATION_TYPES.ADMIN_PAYMENT_FAILED]: '💳',
  [NOTIFICATION_TYPES.ADMIN_SYSTEM_ERROR]: '🚨',

  // Sales
  [NOTIFICATION_TYPES.SALES_LEAD_ASSIGNED]: '👥',
  [NOTIFICATION_TYPES.SALES_LEAD_UPDATED]: '📝',
  [NOTIFICATION_TYPES.SALES_LEAD_CONVERTED]: '🎉',
  [NOTIFICATION_TYPES.SALES_EVENT_SIGNUP]: '📅',
  [NOTIFICATION_TYPES.SALES_FOLLOW_UP_DUE]: '⏰',
  [NOTIFICATION_TYPES.SALES_INCOMPLETE_ORDER]: '🛒',

  // Delivery
  [NOTIFICATION_TYPES.DELIVERY_NEW_ASSIGNED]: '🚚',
  [NOTIFICATION_TYPES.DELIVERY_ROUTE_UPDATED]: '🗺️',
  [NOTIFICATION_TYPES.DELIVERY_CANCELLED]: '🚫',
  [NOTIFICATION_TYPES.DELIVERY_COMPLETED]: '✅',

  // Customer
  [NOTIFICATION_TYPES.CUSTOMER_ORDER_CONFIRMED]: '✅',
  [NOTIFICATION_TYPES.CUSTOMER_ORDER_SHIPPED]: '📦',
  [NOTIFICATION_TYPES.CUSTOMER_DELIVERY_SCHEDULED]: '📅',
  [NOTIFICATION_TYPES.CUSTOMER_PAYMENT_ISSUE]: '⚠️',
}

// Priority colors for UI
export const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'text-gray-600',
  normal: 'text-blue-600',
  high: 'text-orange-600',
  urgent: 'text-red-600',
}

export const PRIORITY_BG_COLORS: Record<Priority, string> = {
  low: 'bg-gray-100',
  normal: 'bg-blue-100',
  high: 'bg-orange-100',
  urgent: 'bg-red-100',
}
