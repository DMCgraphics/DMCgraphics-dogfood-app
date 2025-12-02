"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Upload, Mail, CheckCircle2, XCircle, Clock, Copy, RefreshCw, Send, UserPlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type Invitation = {
  id: string
  token: string
  email: string
  customer_name: string | null
  status: string
  created_at: string
  expires_at: string
  claimed_at: string | null
}

type ParsedSubscription = {
  email: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  stripePriceId?: string
  planName?: string
  quantity?: number
  currency?: string
  interval?: string
  intervalCount?: number
  amountCents?: number
  billingCycle?: string
  customerName?: string
  metadata?: Record<string, any>
  subscriptionStartDate?: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
}

export default function AdminInvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<ParsedSubscription[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualForm, setManualForm] = useState({
    email: "",
    customerName: "",
    stripeCustomerId: "",
    stripeSubscriptionId: "",
    stripePriceId: "",
  })

  useEffect(() => {
    fetchInvitations()
  }, [statusFilter])

  const fetchInvitations = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }

      const response = await fetch(`/api/admin/invitations?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setInvitations(data.invitations || [])
      } else {
        setError("Failed to load invitations")
      }
    } catch (err) {
      console.error("Failed to fetch invitations:", err)
      setError("Failed to load invitations")
    } finally {
      setIsLoading(false)
    }
  }

  const parseCSV = (file: File): Promise<ParsedSubscription[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split('\n')
          const headers = lines[0].split(',')

          // Map CSV columns to our fields
          const emailIdx = headers.findIndex(h => h.toLowerCase().includes('email'))
          const customerIdIdx = headers.findIndex(h => h.toLowerCase().includes('customer id'))
          const subscriptionIdIdx = headers.findIndex(h => h.toLowerCase().startsWith('id'))
          const priceIdIdx = headers.findIndex(h => h.toLowerCase().includes('plan'))
          const nameIdx = headers.findIndex(h => h.toLowerCase().includes('customer name'))
          const amountIdx = headers.findIndex(h => h.toLowerCase().includes('amount'))
          const intervalIdx = headers.findIndex(h => h.toLowerCase().includes('interval'))
          const currencyIdx = headers.findIndex(h => h.toLowerCase().includes('currency'))
          const statusIdx = headers.findIndex(h => h.toLowerCase().includes('status'))
          const startDateIdx = headers.findIndex(h => h.toLowerCase().includes('start date'))
          const periodStartIdx = headers.findIndex(h => h.toLowerCase().includes('period start'))
          const periodEndIdx = headers.findIndex(h => h.toLowerCase().includes('period end'))

          const subscriptions: ParsedSubscription[] = []

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue

            const values = line.split(',')

            const email = values[emailIdx]?.trim()
            const customerId = values[customerIdIdx]?.trim()
            const subscriptionId = values[subscriptionIdIdx]?.trim()
            const status = values[statusIdx]?.trim()

            // Only include active subscriptions
            if (!email || !customerId || !subscriptionId || status?.toLowerCase() !== 'active') {
              continue
            }

            const subscription: ParsedSubscription = {
              email,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: values[priceIdIdx]?.trim(),
              customerName: values[nameIdx]?.trim(),
              currency: values[currencyIdx]?.trim() || 'usd',
              interval: values[intervalIdx]?.trim(),
              billingCycle: values[intervalIdx]?.trim(),
              subscriptionStartDate: values[startDateIdx]?.trim(),
              currentPeriodStart: values[periodStartIdx]?.trim(),
              currentPeriodEnd: values[periodEndIdx]?.trim(),
            }

            // Parse amount
            if (values[amountIdx]) {
              const amount = parseFloat(values[amountIdx].trim())
              if (!isNaN(amount)) {
                subscription.amountCents = Math.round(amount * 100)
              }
            }

            subscriptions.push(subscription)
          }

          resolve(subscriptions)
        } catch (err) {
          reject(err)
        }
      }

      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsText(file)
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    setError("")
    setSuccess("")

    try {
      const parsed = await parseCSV(file)
      setPreviewData(parsed)
      setShowPreview(true)
    } catch (err: any) {
      setError(`Failed to parse CSV: ${err.message}`)
      setCsvFile(null)
    }
  }

  const handleCreateInvitations = async () => {
    if (previewData.length === 0) {
      setError("No valid subscriptions to import")
      return
    }

    setIsUploading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/invitations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitations: previewData
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Created ${data.created} invitations. ${data.failed > 0 ? `${data.failed} failed.` : ''}`)
        setShowPreview(false)
        setCsvFile(null)
        setPreviewData([])
        fetchInvitations()
      } else {
        setError(data.error || "Failed to create invitations")
      }
    } catch (err: any) {
      setError(`Failed to create invitations: ${err.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/auth/signup?invite=${token}`
    navigator.clipboard.writeText(link)
    setSuccess("Invitation link copied to clipboard!")
    setTimeout(() => setSuccess(""), 3000)
  }

  const sendInvitation = async (invitationId: string, email: string) => {
    setIsSending(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/invitations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Invitation email sent to ${email}`)
        fetchInvitations()
      } else {
        setError(data.error || "Failed to send invitation")
      }
    } catch (err: any) {
      setError(`Failed to send invitation: ${err.message}`)
    } finally {
      setIsSending(false)
    }
  }

  const sendBatchInvitations = async () => {
    if (!confirm(`Send invitation emails to all ${invitations.filter(i => i.status === 'pending').length} pending invitations?`)) {
      return
    }

    setIsSending(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/invitations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSend: true, status: 'pending' })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Sent ${data.sent} invitations. ${data.failed > 0 ? `${data.failed} failed.` : ''}`)
        fetchInvitations()
      } else {
        setError(data.error || "Failed to send invitations")
      }
    } catch (err: any) {
      setError(`Failed to send invitations: ${err.message}`)
    } finally {
      setIsSending(false)
    }
  }

  const handleCreateManualInvitation = async () => {
    if (!manualForm.email || !manualForm.stripeCustomerId || !manualForm.stripeSubscriptionId) {
      setError("Email, Stripe Customer ID, and Stripe Subscription ID are required")
      return
    }

    setIsUploading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/invitations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: manualForm.email,
          customerName: manualForm.customerName,
          stripeCustomerId: manualForm.stripeCustomerId,
          stripeSubscriptionId: manualForm.stripeSubscriptionId,
          stripePriceId: manualForm.stripePriceId,
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Invitation created for ${manualForm.email}`)
        setManualForm({
          email: "",
          customerName: "",
          stripeCustomerId: "",
          stripeSubscriptionId: "",
          stripePriceId: "",
        })
        setShowManualForm(false)
        fetchInvitations()
      } else {
        setError(data.error || "Failed to create invitation")
      }
    } catch (err: any) {
      setError(`Failed to create invitation: ${err.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      pending: { variant: "secondary", icon: Clock },
      sent: { variant: "default", icon: Mail },
      claimed: { variant: "success", icon: CheckCircle2 },
      expired: { variant: "destructive", icon: XCircle },
      cancelled: { variant: "destructive", icon: XCircle },
    }

    const config = variants[status] || variants.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscription Invitations</h1>
        <p className="text-muted-foreground mt-2">
          Import existing Stripe subscribers and invite them to create accounts
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">{success}</AlertDescription>
        </Alert>
      )}

      {/* Manual Invitation */}
      <Card>
        <CardHeader>
          <CardTitle>Create Manual Invitation</CardTitle>
          <CardDescription>
            Invite individual users for testing without uploading a CSV
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showManualForm ? (
            <Button onClick={() => setShowManualForm(true)} variant="outline">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User Manually
            </Button>
          ) : (
            <div className="space-y-4 border rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manual-email">Email *</Label>
                  <Input
                    id="manual-email"
                    type="email"
                    placeholder="customer@example.com"
                    value={manualForm.email}
                    onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="manual-name">Customer Name</Label>
                  <Input
                    id="manual-name"
                    type="text"
                    placeholder="John Doe"
                    value={manualForm.customerName}
                    onChange={(e) => setManualForm({ ...manualForm, customerName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manual-customer-id">Stripe Customer ID *</Label>
                  <Input
                    id="manual-customer-id"
                    type="text"
                    placeholder="cus_xxxxx"
                    value={manualForm.stripeCustomerId}
                    onChange={(e) => setManualForm({ ...manualForm, stripeCustomerId: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="manual-subscription-id">Stripe Subscription ID *</Label>
                  <Input
                    id="manual-subscription-id"
                    type="text"
                    placeholder="sub_xxxxx"
                    value={manualForm.stripeSubscriptionId}
                    onChange={(e) => setManualForm({ ...manualForm, stripeSubscriptionId: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="manual-price-id">Stripe Price ID (Optional)</Label>
                <Input
                  id="manual-price-id"
                  type="text"
                  placeholder="price_xxxxx"
                  value={manualForm.stripePriceId}
                  onChange={(e) => setManualForm({ ...manualForm, stripePriceId: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateManualInvitation}
                  disabled={isUploading || !manualForm.email || !manualForm.stripeCustomerId || !manualForm.stripeSubscriptionId}
                >
                  {isUploading ? "Creating..." : "Create Invitation"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowManualForm(false)
                    setManualForm({
                      email: "",
                      customerName: "",
                      stripeCustomerId: "",
                      stripeSubscriptionId: "",
                      stripePriceId: "",
                    })
                  }}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload CSV */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Subscription CSV</CardTitle>
          <CardDescription>
            Import a CSV export from Stripe with customer and subscription data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="csv-upload">CSV File</Label>
            <Input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Expected columns: id, Customer ID, Customer Email, Status, Amount, Interval, etc.
            </p>
          </div>

          {showPreview && previewData.length > 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Preview ({previewData.length} subscriptions)</h3>
                <p className="text-sm text-muted-foreground">
                  Showing first 5 entries. Only active subscriptions will be imported.
                </p>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Subscription ID</TableHead>
                      <TableHead>Customer ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.slice(0, 5).map((sub, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-sm">{sub.email}</TableCell>
                        <TableCell>{sub.customerName || '-'}</TableCell>
                        <TableCell className="font-mono text-xs">{sub.stripeSubscriptionId}</TableCell>
                        <TableCell className="font-mono text-xs">{sub.stripeCustomerId}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateInvitations}
                  disabled={isUploading}
                >
                  {isUploading ? "Creating..." : `Create ${previewData.length} Invitations`}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPreview(false)
                    setCsvFile(null)
                    setPreviewData([])
                  }}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invitations</CardTitle>
              <CardDescription>Manage and track invitation status</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="claimed">Claimed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchInvitations}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              {invitations.filter(i => i.status === 'pending').length > 0 && (
                <Button onClick={sendBatchInvitations} disabled={isSending}>
                  <Send className="h-4 w-4 mr-2" />
                  Send All Pending ({invitations.filter(i => i.status === 'pending').length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invitations found. Upload a CSV to get started.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-mono text-sm">{invitation.email}</TableCell>
                      <TableCell>{invitation.customer_name || '-'}</TableCell>
                      <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(invitation.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(invitation.expires_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {invitation.status === 'pending' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => sendInvitation(invitation.id, invitation.email)}
                              disabled={isSending}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Send
                            </Button>
                          )}
                          {(invitation.status === 'pending' || invitation.status === 'sent') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyInviteLink(invitation.token)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                          {invitation.status === 'claimed' && (
                            <span className="text-sm text-muted-foreground">Claimed</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
