"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Eye, Mail, Download, RefreshCw, ShoppingCart } from "lucide-react"
import jsPDF from "jspdf"
import Link from "next/link"

interface PurchaseOrder {
  id: string
  po_number: string
  vendor_id: string
  order_date: string
  needed_by_date: string
  pickup_date: string
  pickup_time: string | null
  status: string
  notes: string | null
  created_at: string
  vendors: {
    id: string
    name: string
    contact_email: string
    contact_name: string
  }
  purchase_order_items: {
    id: string
    ingredient_name: string
    quantity_lbs: string
    unit_price_cents: number
    total_price_cents: number
    notes: string | null
  }[]
}

const STATUS_COLORS: { [key: string]: string } = {
  draft: "bg-gray-500",
  sent: "bg-blue-500",
  confirmed: "bg-green-500",
  picked_up: "bg-purple-500",
  received: "bg-emerald-600",
  cancelled: "bg-red-500",
}

const STATUS_LABELS: { [key: string]: string } = {
  draft: "Draft",
  sent: "Sent",
  confirmed: "Confirmed",
  picked_up: "Picked Up",
  received: "Received",
  cancelled: "Cancelled",
}

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/purchase-orders")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch purchase orders")
      }

      setPurchaseOrders(data.purchaseOrders || [])
    } catch (error: any) {
      console.error("Error fetching purchase orders:", error)
      toast.error(error.message || "Failed to load purchase orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPurchaseOrders()
  }, [])

  const handleViewDetails = (po: PurchaseOrder) => {
    setSelectedPO(po)
    setDetailsOpen(true)
  }

  const handleStatusChange = async (poId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/purchase-orders/${poId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update status")
      }

      toast.success("Status updated successfully")
      fetchPurchaseOrders()
    } catch (error: any) {
      console.error("Error updating status:", error)
      toast.error(error.message || "Failed to update status")
    }
  }

  const handleSendEmail = async (po: PurchaseOrder) => {
    try {
      setSendingEmail(true)
      const response = await fetch(`/api/admin/purchase-orders/${po.id}/send-email`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email")
      }

      toast.success(`Email sent to ${po.vendors.contact_email}`)
      fetchPurchaseOrders()
    } catch (error: any) {
      console.error("Error sending email:", error)
      toast.error(error.message || "Failed to send email")
    } finally {
      setSendingEmail(false)
    }
  }

  const handleDownloadPDF = (po: PurchaseOrder) => {
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      let yPos = 20

      // NouriPet Header
      doc.setFillColor(34, 197, 94)
      doc.rect(0, 0, pageWidth, 35, "F")

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(28)
      doc.setFont("helvetica", "bold")
      doc.text("NouriPet", 15, 20)

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text("Fresh Dog Food - Locally Sourced", 15, 28)

      yPos = 50

      // Purchase Order Title
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(20)
      doc.setFont("helvetica", "bold")
      doc.text("Purchase Order", 15, yPos)
      yPos += 15

      // Order Details Box
      doc.setDrawColor(34, 197, 94)
      doc.setLineWidth(0.5)
      doc.rect(15, yPos, pageWidth - 30, 50)

      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      yPos += 8
      doc.text(`PO Number: ${po.po_number}`, 20, yPos)
      yPos += 7
      doc.text(`Vendor: ${po.vendors.name}`, 20, yPos)
      yPos += 7
      doc.setFont("helvetica", "normal")
      doc.text(`Order Date: ${new Date(po.order_date).toLocaleDateString()}`, 20, yPos)
      yPos += 7
      doc.text(`Needed By: ${new Date(po.needed_by_date).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      })}`, 20, yPos)
      yPos += 7
      doc.setTextColor(34, 197, 94)
      doc.setFont("helvetica", "bold")
      doc.text(`Pickup Date: ${new Date(po.pickup_date).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      })}`, 20, yPos)
      doc.setTextColor(0, 0, 0)

      yPos += 20

      // Items Table Header
      doc.setFillColor(248, 249, 250)
      doc.rect(15, yPos, pageWidth - 30, 10, "F")
      doc.setFont("helvetica", "bold")
      doc.setFontSize(11)
      doc.text("Ingredient", 20, yPos + 7)
      doc.text("Quantity", pageWidth - 50, yPos + 7)
      yPos += 10

      // Items
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)

      po.purchase_order_items.forEach((item, idx) => {
        if (yPos > pageHeight - 40) {
          doc.addPage()
          yPos = 20
        }

        if (idx % 2 === 0) {
          doc.setFillColor(250, 250, 250)
          doc.rect(15, yPos, pageWidth - 30, 8, "F")
        }

        doc.text(item.ingredient_name, 20, yPos + 6)
        doc.text(`${parseFloat(item.quantity_lbs).toFixed(1)} lbs`, pageWidth - 50, yPos + 6)
        yPos += 8
      })

      // Total
      const totalLbs = po.purchase_order_items.reduce((sum, item) => sum + parseFloat(item.quantity_lbs), 0)
      yPos += 5
      doc.setDrawColor(34, 197, 94)
      doc.setLineWidth(0.8)
      doc.line(15, yPos, pageWidth - 15, yPos)
      yPos += 8
      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.text("TOTAL:", 20, yPos)
      doc.text(`${totalLbs.toFixed(1)} lbs`, pageWidth - 50, yPos)

      // Notes
      if (po.notes) {
        yPos += 15
        doc.setFillColor(254, 243, 199)
        doc.rect(15, yPos, pageWidth - 30, 20, "F")
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.text("Additional Notes:", 20, yPos + 7)
        doc.setFont("helvetica", "normal")
        const splitNotes = doc.splitTextToSize(po.notes, pageWidth - 40)
        doc.text(splitNotes, 20, yPos + 13)
        yPos += 25
      }

      // Footer
      yPos = pageHeight - 25
      doc.setFillColor(248, 249, 250)
      doc.rect(0, yPos, pageWidth, 25, "F")
      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      doc.text("NouriPet", 15, yPos + 7)
      doc.setFont("helvetica", "normal")
      doc.text("Phone: (203) 208-6186", 15, yPos + 12)
      doc.text("Email: orders@nouripet.net", 15, yPos + 17)

      doc.save(`${po.po_number}-${po.vendors.name.replace(/\s+/g, '-')}.pdf`)
      toast.success("PDF downloaded successfully")
    } catch (error: any) {
      console.error("PDF generation error:", error)
      toast.error("Failed to generate PDF")
    }
  }

  const calculateTotal = (items: PurchaseOrder['purchase_order_items']) => {
    return items.reduce((sum, item) => sum + parseFloat(item.quantity_lbs), 0)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage vendor orders and track fulfillment
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/batch-planning">
            <Button variant="outline" size="sm">
              Back to Batch Planning
            </Button>
          </Link>
          <Button onClick={fetchPurchaseOrders} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {purchaseOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No purchase orders yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first PO from the batch planning page
            </p>
            <Link href="/admin/batch-planning">
              <Button>Go to Batch Planning</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Pickup Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total (lbs)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-mono font-medium">
                      {po.po_number}
                    </TableCell>
                    <TableCell>{po.vendors.name}</TableCell>
                    <TableCell>
                      {new Date(po.order_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(po.pickup_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={po.status}
                        onValueChange={(value) => handleStatusChange(po.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <Badge className={STATUS_COLORS[po.status]}>
                            {STATUS_LABELS[po.status]}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="picked_up">Picked Up</SelectItem>
                          <SelectItem value="received">Received</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{po.purchase_order_items.length}</TableCell>
                    <TableCell className="font-mono">
                      {calculateTotal(po.purchase_order_items).toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(po)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPDF(po)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {(po.status === "draft" || po.status === "sent") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendEmail(po)}
                            disabled={sendingEmail}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* PO Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
            <DialogDescription>
              {selectedPO?.po_number} - {selectedPO?.vendors.name}
            </DialogDescription>
          </DialogHeader>

          {selectedPO && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order Date</p>
                  <p>{new Date(selectedPO.order_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Needed By</p>
                  <p>{new Date(selectedPO.needed_by_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pickup Date</p>
                  <p>{new Date(selectedPO.pickup_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={STATUS_COLORS[selectedPO.status]}>
                    {STATUS_LABELS[selectedPO.status]}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Vendor Contact</p>
                <div className="bg-muted/50 p-3 rounded-md space-y-1 text-sm">
                  <p><strong>{selectedPO.vendors.contact_name}</strong></p>
                  <p>{selectedPO.vendors.contact_email}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Line Items</p>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ingredient</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPO.purchase_order_items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.ingredient_name}</TableCell>
                          <TableCell className="text-right font-mono">
                            {parseFloat(item.quantity_lbs).toFixed(1)} lbs
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell className="font-bold">Total</TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {calculateTotal(selectedPO.purchase_order_items).toFixed(1)} lbs
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {selectedPO.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-md">
                    <p className="text-sm">{selectedPO.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
            {selectedPO && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleDownloadPDF(selectedPO)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                {(selectedPO.status === "draft" || selectedPO.status === "sent") && (
                  <Button
                    onClick={() => {
                      handleSendEmail(selectedPO)
                      setDetailsOpen(false)
                    }}
                    disabled={sendingEmail}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
