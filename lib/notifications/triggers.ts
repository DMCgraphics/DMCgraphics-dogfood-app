import { NotificationService } from './service'
import { NOTIFICATION_TYPES } from './types'

/**
 * Notification trigger helpers for common events
 * Call these from your application code (webhooks, API routes, etc.)
 */

/**
 * Notify admins of a new order
 */
export async function notifyNewOrder(params: {
  orderId: string
  orderNumber: string
  customerName?: string
  totalCents: number
  adminUserIds: string[]
}) {
  const { orderId, orderNumber, customerName, totalCents, adminUserIds } = params

  const totalFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(totalCents / 100)

  // Create notification for each admin
  const notifications = adminUserIds.map(userId => ({
    userId,
    portalType: 'admin' as const,
    notificationType: NOTIFICATION_TYPES.ADMIN_NEW_ORDER,
    title: 'New Order Received',
    message: `Order ${orderNumber}${customerName ? ` from ${customerName}` : ''} (${totalFormatted})`,
    link: `/admin/customer-management/orders?search=${orderNumber}`,
    priority: 'normal' as const,
    metadata: {
      order_id: orderId,
      order_number: orderNumber,
      customer_name: customerName,
      total_cents: totalCents,
    },
  }))

  await NotificationService.createBulk(notifications)
}

/**
 * Notify admins when an order is cancelled
 */
export async function notifyOrderCancelled(params: {
  orderId: string
  orderNumber: string
  customerName?: string
  reason?: string
  adminUserIds: string[]
}) {
  const { orderId, orderNumber, customerName, reason, adminUserIds } = params

  const message = reason
    ? `Order ${orderNumber}${customerName ? ` from ${customerName}` : ''} was cancelled: ${reason}`
    : `Order ${orderNumber}${customerName ? ` from ${customerName}` : ''} was cancelled`

  const notifications = adminUserIds.map(userId => ({
    userId,
    portalType: 'admin' as const,
    notificationType: NOTIFICATION_TYPES.ADMIN_ORDER_CANCELLED,
    title: 'Order Cancelled',
    message,
    link: `/admin/customer-management/orders?search=${orderNumber}`,
    priority: 'normal' as const,
    metadata: {
      order_id: orderId,
      order_number: orderNumber,
      customer_name: customerName,
      reason,
    },
  }))

  await NotificationService.createBulk(notifications)
}

/**
 * Notify admins when a payment fails
 */
export async function notifyPaymentFailed(params: {
  customerId: string
  customerEmail: string
  customerName?: string
  subscriptionId?: string
  amount?: number
  adminUserIds: string[]
}) {
  const { customerId, customerEmail, customerName, subscriptionId, amount, adminUserIds } = params

  const amountFormatted = amount
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount / 100)
    : ''

  const message = `Payment failed for ${customerName || customerEmail}${amountFormatted ? ` (${amountFormatted})` : ''}`

  const notifications = adminUserIds.map(userId => ({
    userId,
    portalType: 'admin' as const,
    notificationType: NOTIFICATION_TYPES.ADMIN_PAYMENT_FAILED,
    title: 'Payment Failed',
    message,
    link: `/admin/customer-management/users?search=${customerEmail}`,
    priority: 'high' as const,
    metadata: {
      customer_id: customerId,
      customer_email: customerEmail,
      customer_name: customerName,
      subscription_id: subscriptionId,
      amount,
    },
  }))

  await NotificationService.createBulk(notifications)
}

/**
 * Notify admins of a new user registration
 */
export async function notifyNewUser(params: {
  userId: string
  userEmail: string
  userName?: string
  adminUserIds: string[]
}) {
  const { userId, userEmail, userName, adminUserIds } = params

  const notifications = adminUserIds.map(adminId => ({
    userId: adminId,
    portalType: 'admin' as const,
    notificationType: NOTIFICATION_TYPES.ADMIN_NEW_USER,
    title: 'New User Registration',
    message: `${userName || userEmail} just signed up`,
    link: `/admin/customer-management/users?search=${userEmail}`,
    priority: 'low' as const,
    metadata: {
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
    },
  }))

  await NotificationService.createBulk(notifications)
}

/**
 * Notify sales rep when a lead is converted to a customer
 */
export async function notifyLeadConverted(params: {
  leadId: string
  leadEmail: string
  leadName?: string
  salesRepId: string
  convertedToUserId: string
}) {
  const { leadId, leadEmail, leadName, salesRepId, convertedToUserId } = params

  await NotificationService.create({
    userId: salesRepId,
    portalType: 'sales',
    notificationType: NOTIFICATION_TYPES.SALES_LEAD_CONVERTED,
    title: 'Lead Converted! 🎉',
    message: `${leadName || leadEmail} just became a customer!`,
    link: `/admin/customer-management/users?search=${leadEmail}`,
    priority: 'normal',
    metadata: {
      lead_id: leadId,
      lead_email: leadEmail,
      lead_name: leadName,
      converted_to_user_id: convertedToUserId,
    },
  })
}

/**
 * Notify sales rep when an email is opened
 */
export async function notifyEmailOpened(params: {
  activityId: string
  leadId: string
  leadEmail: string
  emailSubject: string
  salesRepId: string
}) {
  const { activityId, leadId, leadEmail, emailSubject, salesRepId } = params

  await NotificationService.create({
    userId: salesRepId,
    portalType: 'sales',
    notificationType: 'sales_email_opened',
    title: 'Email Opened',
    message: `${leadEmail} opened: "${emailSubject}"`,
    link: `/admin/sales/leads/${leadId}`,
    priority: 'low',
    metadata: {
      activity_id: activityId,
      lead_id: leadId,
      lead_email: leadEmail,
      email_subject: emailSubject,
    },
  })
}

/**
 * Notify sales rep when a follow-up is due
 */
export async function notifyFollowUpDue(params: {
  leadId: string
  leadEmail: string
  leadName?: string
  salesRepId: string
  dueDate: string
}) {
  const { leadId, leadEmail, leadName, salesRepId, dueDate } = params

  await NotificationService.create({
    userId: salesRepId,
    portalType: 'sales',
    notificationType: NOTIFICATION_TYPES.SALES_FOLLOW_UP_DUE,
    title: 'Follow-up Due',
    message: `Time to follow up with ${leadName || leadEmail}`,
    link: `/admin/sales/leads/${leadId}`,
    priority: 'normal',
    metadata: {
      lead_id: leadId,
      lead_email: leadEmail,
      lead_name: leadName,
      due_date: dueDate,
    },
  })
}

/**
 * Helper to get all admin user IDs
 */
export async function getAdminUserIds(): Promise<string[]> {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .contains('roles', ['admin'])

  if (error) {
    console.error('[getAdminUserIds] Error:', error)
    return []
  }

  return data.map(profile => profile.id)
}
