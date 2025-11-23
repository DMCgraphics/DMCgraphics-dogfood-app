"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Package, Clock, XCircle, RefreshCw, AlertTriangle, Pause, Play, Settings } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface TopperSubscription {
  id: string
  status: string
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string
  currentPeriodStart: string
  created: string
  dogId: string
  dogName: string
  dogSize: string
  productType: string
  amount: number
  interval: string
  isPaused: boolean
}

interface TopperOrder {
  id: string
  paymentIntentId: string
  status: string
  created: string
  dogId: string
  dogName: string
  productType: string
  recipeName: string
  amount: number
  canCancel: boolean
  cancelDeadline: string
}

export function TopperOrdersManager() {
  const [subscriptions, setSubscriptions] = useState<TopperSubscription[]>([])
  const [orders, setOrders] = useState<TopperOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<{ type: 'subscription' | 'order', id: string, name: string } | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isPausingId, setIsPausingId] = useState<string | null>(null)
  const [modifyTarget, setModifyTarget] = useState<TopperSubscription | null>(null)
  const [selectedNewLevel, setSelectedNewLevel] = useState<string>("")
  const [isModifying, setIsModifying] = useState(false)

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/topper-orders')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch orders')
      }

      setSubscriptions(data.subscriptions || [])
      setOrders(data.orders || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleCancel = async () => {
    if (!cancelTarget) return

    setIsCancelling(true)
    try {
      const response = await fetch('/api/topper-orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: cancelTarget.type, id: cancelTarget.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel')
      }

      // Refresh the list
      await fetchOrders()
      setCancelTarget(null)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsCancelling(false)
    }
  }

  const handlePause = async (subscriptionId: string) => {
    setIsPausingId(subscriptionId)
    try {
      const response = await fetch('/api/topper-orders/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause', subscriptionId }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to pause')

      await fetchOrders()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsPausingId(null)
    }
  }

  const handleResume = async (subscriptionId: string) => {
    setIsPausingId(subscriptionId)
    try {
      const response = await fetch('/api/topper-orders/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume', subscriptionId }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to resume')

      await fetchOrders()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsPausingId(null)
    }
  }

  const handleModify = async () => {
    if (!modifyTarget || !selectedNewLevel) return

    setIsModifying(true)
    try {
      const response = await fetch('/api/topper-orders/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'modify',
          subscriptionId: modifyTarget.id,
          newLevel: selectedNewLevel,
          dogSize: modifyTarget.dogSize,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to modify')

      await fetchOrders()
      setModifyTarget(null)
      setSelectedNewLevel("")
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsModifying(false)
    }
  }

  const getProductTypeName = (type: string) => {
    switch (type) {
      case '25': return '25% Topper Plan'
      case '50': return '50% Topper Plan'
      case '75': return '75% Topper Plan'
      case 'individual': return 'Single Pack'
      case '3-packs': return '3 Pack Bundle'
      default: return type
    }
  }

  const getStatusBadge = (status: string, cancelAtPeriodEnd?: boolean) => {
    if (cancelAtPeriodEnd) {
      return <Badge variant="outline" className="text-orange-600 border-orange-300">Cancelling</Badge>
    }
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>
      case 'paid':
        return <Badge className="bg-blue-100 text-blue-800">Paid</Badge>
      case 'canceled':
        return <Badge variant="outline" className="text-muted-foreground">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatTimeRemaining = (deadline: string) => {
    const remaining = new Date(deadline).getTime() - Date.now()
    if (remaining <= 0) return 'Expired'
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m remaining`
  }

  // Don't render if no data
  if (!isLoading && subscriptions.length === 0 && orders.length === 0) {
    return null
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Topper Orders & Subscriptions
              </CardTitle>
              <CardDescription>
                Manage your topper plans and individual pack orders
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchOrders} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">{error}</div>
          ) : (
            <>
              {/* Topper Subscriptions */}
              {subscriptions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Active Subscriptions
                  </h4>
                  {subscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 border rounded-lg bg-muted/30 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="font-medium">{getProductTypeName(sub.productType)}</span>
                            {getStatusBadge(sub.status, sub.cancelAtPeriodEnd)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            For {sub.dogName || 'your dog'} • ${(sub.amount / 100).toFixed(2)}/2 weeks
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {sub.isPaused ? 'Paused' : `Next billing: ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`}
                          </p>
                        </div>
                        {sub.cancelAtPeriodEnd && (
                          <p className="text-sm text-orange-600">
                            Ends {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {!sub.cancelAtPeriodEnd && (
                        <div className="flex flex-wrap gap-2">
                          {/* Pause/Resume */}
                          {sub.isPaused ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResume(sub.id)}
                              disabled={isPausingId === sub.id}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              {isPausingId === sub.id ? 'Resuming...' : 'Resume'}
                            </Button>
                          ) : sub.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePause(sub.id)}
                              disabled={isPausingId === sub.id}
                            >
                              <Pause className="h-4 w-4 mr-1" />
                              {isPausingId === sub.id ? 'Pausing...' : 'Pause'}
                            </Button>
                          )}

                          {/* Modify */}
                          {(sub.status === 'active' || sub.isPaused) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setModifyTarget(sub)
                                setSelectedNewLevel("")
                              }}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Change Plan
                            </Button>
                          )}

                          {/* Cancel */}
                          {(sub.status === 'active' || sub.isPaused) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setCancelTarget({
                                type: 'subscription',
                                id: sub.id,
                                name: getProductTypeName(sub.productType)
                              })}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Individual Pack Orders */}
              {orders.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Recent Orders
                  </h4>
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {order.recipeName || getProductTypeName(order.productType)}
                          </span>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          For {order.dogName || 'your dog'} • ${(order.amount / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ordered: {new Date(order.created).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        {order.canCancel ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1 text-xs text-orange-600">
                              <Clock className="h-3 w-3" />
                              {formatTimeRemaining(order.cancelDeadline)}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setCancelTarget({
                                type: 'order',
                                id: order.id,
                                name: order.recipeName || getProductTypeName(order.productType)
                              })}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel & Refund
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Processing
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Cancel {cancelTarget?.type === 'subscription' ? 'Subscription' : 'Order'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget?.type === 'subscription' ? (
                <>
                  Your <strong>{cancelTarget.name}</strong> subscription will be cancelled at the end of the current billing period. You'll continue to have access until then.
                </>
              ) : (
                <>
                  Your order for <strong>{cancelTarget?.name}</strong> will be cancelled and you'll receive a full refund. This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Keep It</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modify Plan Dialog */}
      <Dialog open={!!modifyTarget} onOpenChange={(open) => !open && setModifyTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Change Topper Plan
            </DialogTitle>
            <DialogDescription>
              Select a new topper percentage for {modifyTarget?.dogName || 'your dog'}.
              Currently on <strong>{getProductTypeName(modifyTarget?.productType || '')}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {['25', '50', '75'].filter(level => level !== modifyTarget?.productType).map((level) => (
              <div
                key={level}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedNewLevel === level
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-muted-foreground/50'
                }`}
                onClick={() => setSelectedNewLevel(level)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{level}% Topper Plan</div>
                    <div className="text-sm text-muted-foreground">
                      {level === '25' && 'Light supplementation'}
                      {level === '50' && 'Balanced mix'}
                      {level === '75' && 'Maximum fresh food'}
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedNewLevel === level
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground/30'
                  }`} />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setModifyTarget(null)
                setSelectedNewLevel("")
              }}
              disabled={isModifying}
            >
              Cancel
            </Button>
            <Button
              onClick={handleModify}
              disabled={!selectedNewLevel || isModifying}
            >
              {isModifying ? 'Updating...' : 'Update Plan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
