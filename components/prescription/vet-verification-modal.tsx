"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Stethoscope, Upload, CheckCircle, AlertTriangle } from "lucide-react"

interface VetVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onVerificationSubmit: (data: VetVerificationData) => void
  prescriptionDietName: string
}

export interface VetVerificationData {
  vetName: string
  vetClinic: string
  vetPhone: string
  vetEmail: string
  prescriptionNotes: string
  prescriptionFile?: File
}

export function VetVerificationModal({
  isOpen,
  onClose,
  onVerificationSubmit,
  prescriptionDietName,
}: VetVerificationModalProps) {
  const [formData, setFormData] = useState<VetVerificationData>({
    vetName: "",
    vetClinic: "",
    vetPhone: "",
    vetEmail: "",
    prescriptionNotes: "",
  })
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)

    // Simulate verification process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    onVerificationSubmit({
      ...formData,
      prescriptionFile: prescriptionFile || undefined,
    })

    setIsSubmitting(false)
    onClose()
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setPrescriptionFile(file)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Veterinary Verification Required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Card */}
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Prescription Diet: {prescriptionDietName}
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    This therapeutic diet requires veterinary supervision. Please provide your veterinarian's
                    information and prescription details for verification.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Veterinarian Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Veterinarian Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vet-name">Veterinarian Name *</Label>
                <Input
                  id="vet-name"
                  value={formData.vetName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, vetName: e.target.value }))}
                  placeholder="Dr. Smith"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vet-clinic">Clinic Name *</Label>
                <Input
                  id="vet-clinic"
                  value={formData.vetClinic}
                  onChange={(e) => setFormData((prev) => ({ ...prev, vetClinic: e.target.value }))}
                  placeholder="Animal Hospital"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vet-phone">Phone Number *</Label>
                <Input
                  id="vet-phone"
                  type="tel"
                  value={formData.vetPhone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, vetPhone: e.target.value }))}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vet-email">Email Address *</Label>
                <Input
                  id="vet-email"
                  type="email"
                  value={formData.vetEmail}
                  onChange={(e) => setFormData((prev) => ({ ...prev, vetEmail: e.target.value }))}
                  placeholder="vet@clinic.com"
                  required
                />
              </div>
            </div>
          </div>

          {/* Prescription Details */}
          <div className="space-y-4">
            <h3 className="font-semibold">Prescription Details</h3>
            <div className="space-y-2">
              <Label htmlFor="prescription-notes">Medical Notes & Instructions</Label>
              <Textarea
                id="prescription-notes"
                value={formData.prescriptionNotes}
                onChange={(e) => setFormData((prev) => ({ ...prev, prescriptionNotes: e.target.value }))}
                placeholder="Please include diagnosis, feeding instructions, duration of treatment, and any specific requirements..."
                rows={4}
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <h3 className="font-semibold">Prescription Document (Optional)</h3>
            <div className="space-y-2">
              <Label htmlFor="prescription-file">Upload Prescription or Medical Records</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="text-center space-y-2">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Upload prescription document</p>
                    <p className="text-xs text-muted-foreground">PDF, JPG, PNG up to 10MB</p>
                  </div>
                  <Input
                    id="prescription-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("prescription-file")?.click()}
                  >
                    Choose File
                  </Button>
                </div>
                {prescriptionFile && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    {prescriptionFile.name} uploaded successfully
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.vetName || !formData.vetClinic || !formData.vetPhone || !formData.vetEmail || isSubmitting
              }
              className="flex-1"
            >
              {isSubmitting ? "Submitting for Verification..." : "Submit for Verification"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
