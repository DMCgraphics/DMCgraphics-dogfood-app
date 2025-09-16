"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Stethoscope, Clock, CheckCircle, XCircle, AlertTriangle, Calendar, Mail, FileText } from "lucide-react"
import type { VetVerificationRequest } from "@/lib/vet-verification"

interface PrescriptionStatusCardProps {
  verificationRequest: VetVerificationRequest | null
  prescriptionDietName?: string
  expirationDate?: Date
  onContactVet?: () => void
  onRenewPrescription?: () => void
}

export function PrescriptionStatusCard({
  verificationRequest,
  prescriptionDietName,
  expirationDate,
  onContactVet,
  onRenewPrescription,
}: PrescriptionStatusCardProps) {
  if (!verificationRequest && !prescriptionDietName) {
    return null
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "requires-clarification":
        return <AlertTriangle className="h-4 w-4 text-blue-500" />
      default:
        return <Stethoscope className="h-4 w-4 text-primary" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
      case "requires-clarification":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
      default:
        return "bg-primary/10 text-primary"
    }
  }

  const getExpirationStatus = () => {
    if (!expirationDate) return null

    const now = new Date()
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiration < 0) {
      return { status: "expired", message: "Prescription expired", color: "text-red-600" }
    } else if (daysUntilExpiration <= 30) {
      return { status: "expiring", message: `Expires in ${daysUntilExpiration} days`, color: "text-amber-600" }
    } else {
      return { status: "valid", message: `Valid until ${expirationDate.toLocaleDateString()}`, color: "text-green-600" }
    }
  }

  const expirationStatus = getExpirationStatus()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Prescription Status
          </CardTitle>
          {verificationRequest && (
            <Badge className={getStatusColor(verificationRequest.status)}>
              {getStatusIcon(verificationRequest.status)}
              <span className="ml-1 capitalize">{verificationRequest.status.replace("-", " ")}</span>
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Prescription Diet */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Current Prescription Diet</h4>
          <p className="text-sm text-muted-foreground">
            {prescriptionDietName || verificationRequest?.prescriptionDietName || "No prescription diet"}
          </p>
        </div>

        {/* Verification Status */}
        {verificationRequest && (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Verification Progress</span>
                <span>
                  {verificationRequest.status === "approved"
                    ? "100%"
                    : verificationRequest.status === "pending"
                      ? "25%"
                      : "50%"}
                </span>
              </div>
              <Progress
                value={
                  verificationRequest.status === "approved" ? 100 : verificationRequest.status === "pending" ? 25 : 50
                }
                className="h-2"
              />
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">
                {verificationRequest.status === "pending" &&
                  "Your veterinarian has been notified and will review your prescription request."}
                {verificationRequest.status === "approved" &&
                  "Your prescription has been approved! You can continue with your therapeutic diet."}
                {verificationRequest.status === "rejected" &&
                  "Your prescription request was not approved. Please contact your veterinarian."}
                {verificationRequest.status === "requires-clarification" &&
                  "Your veterinarian needs additional information before approving this prescription."}
              </p>
            </div>

            {/* Veterinarian Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Veterinarian:</span>
                <p className="text-muted-foreground">{verificationRequest.vetInfo.name}</p>
              </div>
              <div>
                <span className="font-semibold">Clinic:</span>
                <p className="text-muted-foreground">{verificationRequest.vetInfo.clinic}</p>
              </div>
            </div>
          </div>
        )}

        {/* Expiration Status */}
        {expirationStatus && (
          <div
            className={`p-3 rounded-lg border ${
              expirationStatus.status === "expired"
                ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                : expirationStatus.status === "expiring"
                  ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
                  : "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className={`text-sm font-medium ${expirationStatus.color}`}>{expirationStatus.message}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {verificationRequest?.status === "requires-clarification" && onContactVet && (
            <Button variant="outline" onClick={onContactVet} className="flex-1 bg-transparent">
              <Mail className="h-4 w-4 mr-2" />
              Contact Vet
            </Button>
          )}

          {(expirationStatus?.status === "expiring" || expirationStatus?.status === "expired") &&
            onRenewPrescription && (
              <Button onClick={onRenewPrescription} className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                Renew Prescription
              </Button>
            )}

          {verificationRequest?.prescriptionDetails.fileUrl && (
            <Button variant="outline" className="flex-1 bg-transparent">
              <FileText className="h-4 w-4 mr-2" />
              View Prescription
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
