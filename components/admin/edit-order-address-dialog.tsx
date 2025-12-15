"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface EditOrderAddressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  currentAddress?: {
    customer_name?: string | null
    delivery_address_line1?: string | null
    delivery_address_line2?: string | null
    delivery_city?: string | null
    delivery_state?: string | null
    delivery_zipcode?: string | null
  }
  onSuccess: () => void
}

export function EditOrderAddressDialog({
  open,
  onOpenChange,
  orderId,
  currentAddress,
  onSuccess,
}: EditOrderAddressDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    customer_name: "",
    delivery_address_line1: "",
    delivery_address_line2: "",
    delivery_city: "",
    delivery_state: "",
    delivery_zipcode: "",
  })

  // Populate form when dialog opens with current address data
  useEffect(() => {
    if (open && currentAddress) {
      setFormData({
        customer_name: currentAddress.customer_name || "",
        delivery_address_line1: currentAddress.delivery_address_line1 || "",
        delivery_address_line2: currentAddress.delivery_address_line2 || "",
        delivery_city: currentAddress.delivery_city || "",
        delivery_state: currentAddress.delivery_state || "",
        delivery_zipcode: currentAddress.delivery_zipcode || "",
      })
    }
  }, [open, currentAddress])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/address`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update address")
      }

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error updating address:", error)
      alert(error.message || "Failed to update address")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Delivery Address</DialogTitle>
          <DialogDescription>
            Update the delivery address for this order
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customer_name">Customer Name</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) =>
                  setFormData({ ...formData, customer_name: e.target.value })
                }
                placeholder="John Doe"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address_line1">
                Address Line 1 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address_line1"
                value={formData.delivery_address_line1}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    delivery_address_line1: e.target.value,
                  })
                }
                placeholder="123 Main Street"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                value={formData.delivery_address_line2}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    delivery_address_line2: e.target.value,
                  })
                }
                placeholder="Apt 4B (optional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.delivery_city}
                  onChange={(e) =>
                    setFormData({ ...formData, delivery_city: e.target.value })
                  }
                  placeholder="Stamford"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.delivery_state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      delivery_state: e.target.value,
                    })
                  }
                  placeholder="CT"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="zipcode">
                ZIP Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="zipcode"
                value={formData.delivery_zipcode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    delivery_zipcode: e.target.value,
                  })
                }
                placeholder="06902"
                required
                pattern="[0-9]{5}"
                maxLength={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Address
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
