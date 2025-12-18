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

// Notification icon names (for Lucide React)
export const NOTIFICATION_ICON_NAMES: Record<string, string> = {
  // Admin
  [NOTIFICATION_TYPES.ADMIN_NEW_ORDER]: 'Package',
  [NOTIFICATION_TYPES.ADMIN_ORDER_CANCELLED]: 'XCircle',
  [NOTIFICATION_TYPES.ADMIN_INVENTORY_LOW]: 'AlertTriangle',
  [NOTIFICATION_TYPES.ADMIN_NEW_USER]: 'UserPlus',
  [NOTIFICATION_TYPES.ADMIN_PAYMENT_FAILED]: 'CreditCard',
  [NOTIFICATION_TYPES.ADMIN_SYSTEM_ERROR]: 'AlertOctagon',

  // Sales
  [NOTIFICATION_TYPES.SALES_LEAD_ASSIGNED]: 'Users',
  [NOTIFICATION_TYPES.SALES_LEAD_UPDATED]: 'FileEdit',
  [NOTIFICATION_TYPES.SALES_LEAD_CONVERTED]: 'PartyPopper',
  [NOTIFICATION_TYPES.SALES_EVENT_SIGNUP]: 'Calendar',
  [NOTIFICATION_TYPES.SALES_FOLLOW_UP_DUE]: 'Clock',
  [NOTIFICATION_TYPES.SALES_INCOMPLETE_ORDER]: 'ShoppingCart',

  // Delivery
  [NOTIFICATION_TYPES.DELIVERY_NEW_ASSIGNED]: 'Truck',
  [NOTIFICATION_TYPES.DELIVERY_ROUTE_UPDATED]: 'Map',
  [NOTIFICATION_TYPES.DELIVERY_CANCELLED]: 'Ban',
  [NOTIFICATION_TYPES.DELIVERY_COMPLETED]: 'CheckCircle2',

  // Customer
  [NOTIFICATION_TYPES.CUSTOMER_ORDER_CONFIRMED]: 'CheckCircle2',
  [NOTIFICATION_TYPES.CUSTOMER_ORDER_SHIPPED]: 'Package',
  [NOTIFICATION_TYPES.CUSTOMER_DELIVERY_SCHEDULED]: 'Calendar',
  [NOTIFICATION_TYPES.CUSTOMER_PAYMENT_ISSUE]: 'AlertCircle',
}

// Icon background colors for different notification types
export const NOTIFICATION_ICON_BG_COLORS: Record<string, string> = {
  // Admin
  [NOTIFICATION_TYPES.ADMIN_NEW_ORDER]: 'bg-blue-100',
  [NOTIFICATION_TYPES.ADMIN_ORDER_CANCELLED]: 'bg-red-100',
  [NOTIFICATION_TYPES.ADMIN_INVENTORY_LOW]: 'bg-amber-100',
  [NOTIFICATION_TYPES.ADMIN_NEW_USER]: 'bg-green-100',
  [NOTIFICATION_TYPES.ADMIN_PAYMENT_FAILED]: 'bg-red-100',
  [NOTIFICATION_TYPES.ADMIN_SYSTEM_ERROR]: 'bg-red-100',

  // Sales
  [NOTIFICATION_TYPES.SALES_LEAD_ASSIGNED]: 'bg-purple-100',
  [NOTIFICATION_TYPES.SALES_LEAD_UPDATED]: 'bg-blue-100',
  [NOTIFICATION_TYPES.SALES_LEAD_CONVERTED]: 'bg-green-100',
  [NOTIFICATION_TYPES.SALES_EVENT_SIGNUP]: 'bg-indigo-100',
  [NOTIFICATION_TYPES.SALES_FOLLOW_UP_DUE]: 'bg-orange-100',
  [NOTIFICATION_TYPES.SALES_INCOMPLETE_ORDER]: 'bg-amber-100',

  // Delivery
  [NOTIFICATION_TYPES.DELIVERY_NEW_ASSIGNED]: 'bg-blue-100',
  [NOTIFICATION_TYPES.DELIVERY_ROUTE_UPDATED]: 'bg-purple-100',
  [NOTIFICATION_TYPES.DELIVERY_CANCELLED]: 'bg-red-100',
  [NOTIFICATION_TYPES.DELIVERY_COMPLETED]: 'bg-green-100',

  // Customer
  [NOTIFICATION_TYPES.CUSTOMER_ORDER_CONFIRMED]: 'bg-green-100',
  [NOTIFICATION_TYPES.CUSTOMER_ORDER_SHIPPED]: 'bg-blue-100',
  [NOTIFICATION_TYPES.CUSTOMER_DELIVERY_SCHEDULED]: 'bg-indigo-100',
  [NOTIFICATION_TYPES.CUSTOMER_PAYMENT_ISSUE]: 'bg-amber-100',
}

// Icon colors for different notification types
export const NOTIFICATION_ICON_COLORS: Record<string, string> = {
  // Admin
  [NOTIFICATION_TYPES.ADMIN_NEW_ORDER]: 'text-blue-600',
  [NOTIFICATION_TYPES.ADMIN_ORDER_CANCELLED]: 'text-red-600',
  [NOTIFICATION_TYPES.ADMIN_INVENTORY_LOW]: 'text-amber-600',
  [NOTIFICATION_TYPES.ADMIN_NEW_USER]: 'text-green-600',
  [NOTIFICATION_TYPES.ADMIN_PAYMENT_FAILED]: 'text-red-600',
  [NOTIFICATION_TYPES.ADMIN_SYSTEM_ERROR]: 'text-red-600',

  // Sales
  [NOTIFICATION_TYPES.SALES_LEAD_ASSIGNED]: 'text-purple-600',
  [NOTIFICATION_TYPES.SALES_LEAD_UPDATED]: 'text-blue-600',
  [NOTIFICATION_TYPES.SALES_LEAD_CONVERTED]: 'text-green-600',
  [NOTIFICATION_TYPES.SALES_EVENT_SIGNUP]: 'text-indigo-600',
  [NOTIFICATION_TYPES.SALES_FOLLOW_UP_DUE]: 'text-orange-600',
  [NOTIFICATION_TYPES.SALES_INCOMPLETE_ORDER]: 'text-amber-600',

  // Delivery
  [NOTIFICATION_TYPES.DELIVERY_NEW_ASSIGNED]: 'text-blue-600',
  [NOTIFICATION_TYPES.DELIVERY_ROUTE_UPDATED]: 'text-purple-600',
  [NOTIFICATION_TYPES.DELIVERY_CANCELLED]: 'text-red-600',
  [NOTIFICATION_TYPES.DELIVERY_COMPLETED]: 'text-green-600',

  // Customer
  [NOTIFICATION_TYPES.CUSTOMER_ORDER_CONFIRMED]: 'text-green-600',
  [NOTIFICATION_TYPES.CUSTOMER_ORDER_SHIPPED]: 'text-blue-600',
  [NOTIFICATION_TYPES.CUSTOMER_DELIVERY_SCHEDULED]: 'text-indigo-600',
  [NOTIFICATION_TYPES.CUSTOMER_PAYMENT_ISSUE]: 'text-amber-600',
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
