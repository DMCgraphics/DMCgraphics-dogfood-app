"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  RefreshCcw,
  X,
  Search,
  AlertCircle,
  CheckCircle,
} from "lucide-react"

export default function StripeActionsPage() {
  const [subscriptionId, setSubscriptionId] = useState("")
  const [refundAmount, setRefundAmount] = useState("")
  const [searchEmail, setSearchEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [subscriptionData, setSubscriptionData] = useState<any>(null)

  const handleSearchSubscription = async () => {
    if (!searchEmail) {
      setMessage({ type: "error", text: "Please enter an email address" })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/admin/stripe/search?email=${encodeURIComponent(searchEmail)}`)
      const data = await response.json()

      if (response.ok) {
        setSubscriptionData(data)
        if (data.subscriptions?.length > 0) {
          setSubscriptionId(data.subscriptions[0].stripe_subscription_id)
        }
        setMessage({ type: "success", text: `Found ${data.subscriptions?.length || 0} subscriptions` })
      } else {
        setMessage({ type: "error", text: data.error || "Failed to search" })
        setSubscriptionData(null)
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to search subscriptions" })
      setSubscriptionData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleRefund = async () => {
    if (!subscriptionId) {
      setMessage({ type: "error", text: "Please enter a subscription ID" })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/admin/stripe/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription_id: subscriptionId,
          amount: refundAmount ? parseInt(refundAmount) * 100 : undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: "success",
          text: `Refund issued successfully: $${(data.refund.amount / 100).toFixed(2)}`,
        })
        setRefundAmount("")
      } else {
        setMessage({ type: "error", text: data.error || "Failed to issue refund" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to issue refund" })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!subscriptionId) {
      setMessage({ type: "error", text: "Please enter a subscription ID" })
      return
    }

    const confirmed = window.confirm("Are you sure you want to cancel this subscription immediately?")
    if (!confirmed) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/admin/stripe/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_id: subscriptionId }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: "Subscription canceled successfully" })
      } else {
        setMessage({ type: "error", text: data.error || "Failed to cancel subscription" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to cancel subscription" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stripe Admin Actions</h1>
        <p className="text-gray-600 mt-2">Manage payments, refunds, and subscriptions</p>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Search Customer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Customer
          </CardTitle>
          <CardDescription>Find subscriptions by email address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search-email">Customer Email</Label>
              <Input
                id="search-email"
                type="email"
                placeholder="customer@example.com"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearchSubscription} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {subscriptionData && (
            <div className="border-t pt-4 space-y-2">
              <div className="text-sm font-medium">
                Found {subscriptionData.subscriptions?.length || 0} subscription(s)
              </div>
              {subscriptionData.subscriptions?.map((sub: any) => (
                <div
                  key={sub.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{sub.stripe_subscription_id}</div>
                    <div className="text-sm text-gray-600">
                      Status: <Badge>{sub.status}</Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSubscriptionId(sub.stripe_subscription_id)}
                  >
                    Use This
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refund */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCcw className="h-5 w-5" />
            Issue Refund
          </CardTitle>
          <CardDescription>Refund the latest payment for a subscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="refund-subscription">Subscription ID</Label>
            <Input
              id="refund-subscription"
              placeholder="sub_xxxxxxxxxxxxx"
              value={subscriptionId}
              onChange={(e) => setSubscriptionId(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="refund-amount">Amount (leave empty for full refund)</Label>
            <Input
              id="refund-amount"
              type="number"
              placeholder="29.00"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
            />
          </div>
          <Button onClick={handleRefund} disabled={loading} variant="default">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Issue Refund
          </Button>
        </CardContent>
      </Card>

      {/* Cancel Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <X className="h-5 w-5" />
            Cancel Subscription
          </CardTitle>
          <CardDescription>Immediately cancel a subscription (no refund)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cancel-subscription">Subscription ID</Label>
            <Input
              id="cancel-subscription"
              placeholder="sub_xxxxxxxxxxxxx"
              value={subscriptionId}
              onChange={(e) => setSubscriptionId(e.target.value)}
            />
          </div>
          <Button onClick={handleCancelSubscription} disabled={loading} variant="destructive">
            <X className="h-4 w-4 mr-2" />
            Cancel Subscription
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
