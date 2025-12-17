"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface EditLeadDialogProps {
  lead: {
    id: string
    full_name: string | null
    phone: string | null
    dog_name: string | null
    dog_weight: string | null
    dog_breed: string | null
    zip_code: string | null
    notes: string | null
    tags: string[]
    priority: string
  }
  children: React.ReactNode
}

const priorityOptions = [
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
]

export function EditLeadDialog({ lead, children }: EditLeadDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    full_name: lead.full_name || '',
    phone: lead.phone || '',
    dog_name: lead.dog_name || '',
    dog_weight: lead.dog_weight || '',
    dog_breed: lead.dog_breed || '',
    zip_code: lead.zip_code || '',
    notes: lead.notes || '',
    tags: lead.tags.join(', '),
    priority: lead.priority,
  })

  const handleUpdate = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/sales/update-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadId: lead.id,
          full_name: formData.full_name || null,
          phone: formData.phone || null,
          dog_name: formData.dog_name || null,
          dog_weight: formData.dog_weight || null,
          dog_breed: formData.dog_breed || null,
          zip_code: formData.zip_code || null,
          notes: formData.notes || null,
          tags: formData.tags
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0),
          priority: formData.priority,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update lead")
      }

      toast({
        title: "Lead updated",
        description: "Lead information has been updated successfully",
      })

      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>
          <DialogDescription>
            Update lead information
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Contact Information</h3>

            <div className="grid gap-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="zip_code">ZIP Code</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                placeholder="12345"
              />
            </div>
          </div>

          {/* Dog Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Dog Information</h3>

            <div className="grid gap-2">
              <Label htmlFor="dog_name">Dog Name</Label>
              <Input
                id="dog_name"
                value={formData.dog_name}
                onChange={(e) => setFormData({ ...formData, dog_name: e.target.value })}
                placeholder="Max"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dog_breed">Breed</Label>
              <Input
                id="dog_breed"
                value={formData.dog_breed}
                onChange={(e) => setFormData({ ...formData, dog_breed: e.target.value })}
                placeholder="Golden Retriever"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dog_weight">Weight</Label>
              <Input
                id="dog_weight"
                value={formData.dog_weight}
                onChange={(e) => setFormData({ ...formData, dog_weight: e.target.value })}
                placeholder="50 lbs"
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Additional Information</h3>

            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="interested, follow-up, premium"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes about this lead..."
                rows={4}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
