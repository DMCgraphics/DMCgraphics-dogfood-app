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
import { ShoppingCart, Mail } from "lucide-react"
import { generateMosnerPO, type POGenerationInput } from "@/lib/purchase-orders/po-generator"

interface GeneratePODialogProps {
  recipeName: string
  batchMultiplier?: number
  defaultCookDate?: Date
}

export function GeneratePODialog({
  recipeName,
  batchMultiplier = 1,
  defaultCookDate,
}: GeneratePODialogProps) {
  const [open, setOpen] = useState(false)
  const [cookDate, setCookDate] = useState(
    defaultCookDate?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0]
  )
  const [notes, setNotes] = useState("")
  const [sendEmail, setSendEmail] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewPO, setPreviewPO] = useState<any>(null)

  const handlePreview = () => {
    try {
      const input: POGenerationInput = {
        recipeName,
        batchMultiplier,
        cookDate: new Date(cookDate),
      }
      const po = generateMosnerPO(input)
      setPreviewPO(po)
    } catch (error: any) {
      toast.error(error.message || "Failed to generate PO preview")
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
          recipes: [
            {
              recipeName,
              batchMultiplier,
              cookDate,
            },
          ],
          notes,
          autoSendEmail: sendEmail,
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
        <Button variant="outline" size="sm" className="gap-2">
          <ShoppingCart className="h-4 w-4" />
          Generate PO
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Purchase Order</DialogTitle>
          <DialogDescription>
            Create a purchase order for Mosner Family Brands for {recipeName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipe">Recipe</Label>
              <Input id="recipe" value={recipeName} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="multiplier">Batch Multiplier</Label>
              <Input id="multiplier" type="number" value={batchMultiplier} disabled />
            </div>

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
                <h4 className="font-medium mb-2">Items:</h4>
                <div className="space-y-1">
                  {previewPO.lineItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.ingredientName}</span>
                      <span className="font-mono">
                        {item.orderQuantityLbs.toFixed(1)} lbs
                        {item.requiredLbs < item.orderQuantityLbs && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (min order)
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{previewPO.totalLbs.toFixed(1)} lbs</span>
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

        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
