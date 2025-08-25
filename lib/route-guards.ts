interface OrderStatus {
  orderId: string
  status: "pending" | "completed" | "failed"
  subscriptionId?: string
  timestamp: string
}

export function checkOrderStatus(): OrderStatus | null {
  try {
    // Check for completed order
    const completedOrder = localStorage.getItem("nouripet-order-confirmation")
    if (completedOrder) {
      const order = JSON.parse(completedOrder)
      return {
        orderId: order.orderId,
        status: "completed",
        subscriptionId: order.subscriptionId,
        timestamp: order.timestamp,
      }
    }

    // Check for pending checkout
    const checkoutPlan = localStorage.getItem("nouripet-checkout-plan")
    if (checkoutPlan) {
      const plan = JSON.parse(checkoutPlan)
      return {
        orderId: plan.planId,
        status: "pending",
        timestamp: new Date().toISOString(),
      }
    }

    return null
  } catch (error) {
    console.error("Failed to check order status:", error)
    return null
  }
}

export function hasValidSubscription(): boolean {
  const orderStatus = checkOrderStatus()
  return orderStatus?.status === "completed" && !!orderStatus.subscriptionId
}

export function shouldRedirectToCheckout(): boolean {
  const orderStatus = checkOrderStatus()
  return orderStatus?.status === "pending" || false
}

export function clearPendingOrder(): void {
  localStorage.removeItem("nouripet-checkout-plan")
}

export function getRedirectBanner(): string {
  return "You're almost there — complete checkout to start your subscription."
}
