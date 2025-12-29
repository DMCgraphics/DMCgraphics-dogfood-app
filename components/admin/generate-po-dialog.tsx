"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { ShoppingCart, Mail, Download } from "lucide-react"
import { generateMosnerPO, combinePOs, type POGenerationInput } from "@/lib/purchase-orders/po-generator"
import type { BatchPlanResponse } from "@/app/api/admin/batch-planning/route"
import jsPDF from "jspdf"

interface GeneratePODialogProps {
  batchPlan: BatchPlanResponse
  cookDate: Date
}

export function GeneratePODialog({
  batchPlan,
  cookDate: defaultCookDate,
}: GeneratePODialogProps) {
  const [open, setOpen] = useState(false)
  const [cookDate, setCookDate] = useState(
    defaultCookDate.toISOString().split("T")[0]
  )
  const [notes, setNotes] = useState("")
  const [sendEmail, setSendEmail] = useState(false) // Default to false - require approval before sending
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewPO, setPreviewPO] = useState<any>(null)
  const [editableQuantities, setEditableQuantities] = useState<{ [key: string]: number }>({})

  const handlePreview = () => {
    try {
      // Generate POs for each recipe in the batch
      const generatedPOs = batchPlan.recipeRequirements.map(req => {
        const input: POGenerationInput = {
          recipeName: req.recipe,
          batchMultiplier: req.batchScaleFactor,
          cookDate: new Date(cookDate),
        }
        return generateMosnerPO(input)
      })

      // Combine into single PO
      const combinedPO = generatedPOs.length > 1 ? combinePOs(generatedPOs) : generatedPOs[0]
      setPreviewPO(combinedPO)

      // Initialize editable quantities from preview
      const initialQuantities: { [key: string]: number } = {}
      combinedPO.lineItems.forEach(item => {
        initialQuantities[item.ingredientName] = item.orderQuantityLbs
      })
      setEditableQuantities(initialQuantities)
    } catch (error: any) {
      toast.error(error.message || "Failed to generate PO preview")
    }
  }

  const handleQuantityChange = (ingredientName: string, value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setEditableQuantities(prev => ({
        ...prev,
        [ingredientName]: numValue
      }))
    }
  }

  const calculateTotal = () => {
    return Object.values(editableQuantities).reduce((sum, qty) => sum + qty, 0)
  }

  const handleDownloadPDF = () => {
    if (!previewPO) {
      toast.error("Please preview the PO first")
      return
    }

    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      let yPos = 20

      // NouriPet Header with branding
      doc.setFillColor(34, 197, 94) // #22c55e green
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
      doc.rect(15, yPos, pageWidth - 30, 45)

      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      yPos += 8
      doc.text("Vendor: Mosner Family Brands", 20, yPos)
      yPos += 7
      doc.setFont("helvetica", "normal")
      doc.text(`Needed By: ${previewPO.neededByDate.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      })}`, 20, yPos)
      yPos += 7
      doc.setTextColor(34, 197, 94)
      doc.setFont("helvetica", "bold")
      doc.text(`Pickup Date: ${previewPO.pickupDate.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      })}`, 20, yPos)
      doc.setTextColor(0, 0, 0)
      doc.setFont("helvetica", "normal")
      yPos += 7
      doc.text(`Order Date: ${new Date().toLocaleDateString()}`, 20, yPos)

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

      previewPO.lineItems.forEach((item: any, idx: number) => {
        if (yPos > pageHeight - 40) {
          doc.addPage()
          yPos = 20
        }

        const quantity = editableQuantities[item.ingredientName] || item.orderQuantityLbs

        // Alternate row colors
        if (idx % 2 === 0) {
          doc.setFillColor(250, 250, 250)
          doc.rect(15, yPos, pageWidth - 30, 8, "F")
        }

        doc.text(item.ingredientName, 20, yPos + 6)
        doc.text(`${quantity.toFixed(1)} lbs`, pageWidth - 50, yPos + 6)
        yPos += 8
      })

      // Total
      yPos += 5
      doc.setDrawColor(34, 197, 94)
      doc.setLineWidth(0.8)
      doc.line(15, yPos, pageWidth - 15, yPos)
      yPos += 8
      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.text("TOTAL:", 20, yPos)
      doc.text(`${calculateTotal().toFixed(1)} lbs`, pageWidth - 50, yPos)

      // Notes section
      if (notes) {
        yPos += 15
        doc.setFillColor(254, 243, 199) // Light yellow
        doc.rect(15, yPos, pageWidth - 30, 20, "F")
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.text("Additional Notes:", 20, yPos + 7)
        doc.setFont("helvetica", "normal")
        const splitNotes = doc.splitTextToSize(notes, pageWidth - 40)
        doc.text(splitNotes, 20, yPos + 13)
        yPos += 25
      } else {
        yPos += 10
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

      // Save PDF
      const filename = `NouriPet-PO-${previewPO.pickupDate.toISOString().split('T')[0]}.pdf`
      doc.save(filename)
      toast.success("PDF downloaded successfully")
    } catch (error: any) {
      console.error("PDF generation error:", error)
      toast.error("Failed to generate PDF")
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)

    try {
      const response = await fetch("/api/admin/purchase-orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipes: batchPlan.recipeRequirements.map(req => ({
            recipeName: req.recipe,
            batchMultiplier: req.batchScaleFactor,
            cookDate,
          })),
          notes,
          autoSendEmail: sendEmail,
          customQuantities: editableQuantities,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create purchase order")
      }

      toast.success(
        sendEmail
          ? `Purchase order ${data.purchaseOrder.po_number} created and sent!`
          : `Purchase order ${data.purchaseOrder.po_number} created as draft`
      )

      setOpen(false)
      setPreviewPO(null)
      setNotes("")
    } catch (error: any) {
      console.error("Error creating PO:", error)
      toast.error(error.message || "Failed to create purchase order")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 text-sm sm:text-base">
          <ShoppingCart className="h-4 w-4" />
          Generate Purchase Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Purchase Order</DialogTitle>
          <DialogDescription>
            Create a purchase order for Mosner Family Brands for this batch
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Recipes in this batch</Label>
            <div className="bg-muted/50 p-3 rounded-md space-y-1">
              {batchPlan.recipeRequirements.map((req, idx) => (
                <div key={idx} className="text-sm flex justify-between">
                  <span>{req.recipe}</span>
                  <span className="text-muted-foreground">
                    {req.batchScaleFactor.toFixed(2)}x batch
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div className="space-y-2">
              <Label htmlFor="cookDate">Cook Date</Label>
              <Input
                id="cookDate"
                type="date"
                value={cookDate}
                onChange={(e) => setCookDate(e.target.value)}
              />
            </div>

            <div className="space-y-2 flex items-end">
              <Button onClick={handlePreview} variant="secondary" className="w-full">
                Preview PO
              </Button>
            </div>
          </div>

          {previewPO && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h3 className="font-semibold mb-3">Purchase Order Preview</h3>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Needed By:</span>
                  <span className="font-medium">
                    {previewPO.neededByDate.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pickup Date:</span>
                  <span className="font-medium text-primary">
                    {previewPO.pickupDate.toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="border-t pt-3">
                <h4 className="font-medium mb-2">Items (editable):</h4>
                <div className="space-y-2">
                  {previewPO.lineItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm gap-4">
                      <span className="flex-1">{item.ingredientName}</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={editableQuantities[item.ingredientName] || item.orderQuantityLbs}
                          onChange={(e) => handleQuantityChange(item.ingredientName, e.target.value)}
                          className="w-24 h-8 text-right font-mono"
                        />
                        <span className="text-muted-foreground w-8">lbs</span>
                        {item.requiredLbs < item.orderQuantityLbs && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            (min)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{calculateTotal().toFixed(1)} lbs</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions or notes for the vendor..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="sendEmail"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="sendEmail" className="cursor-pointer">
              Send email to Mosner Family Brands immediately
            </Label>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={!previewPO}
            className="gap-2 sm:mr-auto"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !previewPO}
              className="gap-2"
            >
              {sendEmail && <Mail className="h-4 w-4" />}
              {isGenerating
                ? "Creating..."
                : sendEmail
                  ? "Create & Send PO"
                  : "Create Draft PO"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
