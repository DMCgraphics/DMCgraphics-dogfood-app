"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2 } from "lucide-react"

interface FailedDeliveryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reason: string) => Promise<void>
  orderNumber: string
}

const FAILURE_REASONS = [
  { id: "not_home", label: "Customer not home" },
  { id: "wrong_address", label: "Wrong address" },
  { id: "access_issue", label: "Cannot access location" },
  { id: "refused", label: "Customer refused delivery" },
  { id: "unsafe", label: "Unsafe delivery conditions" },
]

export function FailedDeliveryModal({
  isOpen,
  onClose,
  onSubmit,
  orderNumber
}: FailedDeliveryModalProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [otherReason, setOtherReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleReasonToggle = (reasonId: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reasonId)
        ? prev.filter((id) => id !== reasonId)
        : [...prev, reasonId]
    )
  }

  const handleSubmit = async () => {
    // Build reason string
    const reasons = selectedReasons.map(
      (id) => FAILURE_REASONS.find((r) => r.id === id)?.label
    ).filter(Boolean)

    if (otherReason.trim()) {
      reasons.push(otherReason.trim())
    }

    if (reasons.length === 0) {
      alert("Please select or enter a reason for the failed delivery")
      return
    }

    const fullReason = reasons.join("; ")

    setIsSubmitting(true)
    try {
      await onSubmit(fullReason)
      // Reset form
      setSelectedReasons([])
      setOtherReason("")
      onClose()
    } catch (error) {
      console.error("Error submitting failed delivery:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setSelectedReasons([])
    setOtherReason("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <DialogTitle>Report Failed Delivery</DialogTitle>
          </div>
          <DialogDescription>
            Order #{orderNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quick Reason Checkboxes */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select reason(s):</Label>
            {FAILURE_REASONS.map((reason) => (
              <div key={reason.id} className="flex items-center space-x-2">
                <Checkbox
                  id={reason.id}
                  checked={selectedReasons.includes(reason.id)}
                  onCheckedChange={() => handleReasonToggle(reason.id)}
                  className="h-5 w-5"
                />
                <Label
                  htmlFor={reason.id}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {reason.label}
                </Label>
              </div>
            ))}
          </div>

          {/* Other Reason Text Area */}
          <div className="space-y-2">
            <Label htmlFor="other-reason" className="text-sm font-medium">
              Additional notes (optional):
            </Label>
            <Textarea
              id="other-reason"
              placeholder="Enter additional details..."
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Info */}
          <p className="text-xs text-gray-500">
            This information will be saved with the order and the customer will be notified.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Report Failed Delivery"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
