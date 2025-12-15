"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, ExternalLink, Calendar } from "lucide-react"

interface IncompleteOrdersTableProps {
  orders: any[]
}

export function IncompleteOrdersTable({ orders }: IncompleteOrdersTableProps) {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email)
    setCopiedEmail(email)
    setTimeout(() => setCopiedEmail(null), 2000)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getDaysSinceCreated = (dateString: string) => {
    const created = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-lg font-medium text-gray-600">
            No incomplete orders - all customers have provided delivery info!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const daysSince = getDaysSinceCreated(order.created_at)
        const isUrgent = daysSince > 7
        const email = order.profiles?.email || order.guest_email || "No email"
        const customerName = order.profiles?.full_name || order.customer_name || "Unknown"

        return (
          <Card key={order.id} className={isUrgent ? "border-red-300" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {customerName}
                    {isUrgent && (
                      <Badge variant="destructive" className="text-xs">
                        Urgent - {daysSince} days
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <button
                        onClick={() => copyEmail(email)}
                        className="hover:underline"
                      >
                        {email}
                      </button>
                      {copiedEmail === email && (
                        <span className="text-xs text-green-600">Copied!</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Created {formatDate(order.created_at)} ({daysSince} days ago)
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Badge variant="outline">{order.order_number}</Badge>
                  <div className="text-lg font-semibold">
                    ${(order.total_cents / 100).toFixed(2)}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm font-medium text-yellow-800 mb-1">
                    ⚠️ Missing Delivery Information
                  </p>
                  <p className="text-xs text-yellow-700">
                    Customer has an active subscription but hasn't provided delivery address.
                    Contact them to collect: name, address, city, state, and ZIP code.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Subscription ID:</span>
                    <p className="font-mono text-xs mt-1 break-all">
                      {order.stripe_subscription_id}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <p className="mt-1">
                      <Badge variant="secondary">{order.fulfillment_status}</Badge>
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyEmail(email)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Copy Email
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <a
                      href={`https://dashboard.stripe.com/subscriptions/${order.stripe_subscription_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View in Stripe
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
