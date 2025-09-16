"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Clock, XCircle, AlertCircle, Mail, Calendar, Download } from "lucide-react"
import type { VetVerificationRequest } from "@/lib/vet-verification"

interface VerificationStatusTrackerProps {
  request: VetVerificationRequest
  onResendNotification?: () => void
}

export function VerificationStatusTracker({ request, onResendNotification }: VerificationStatusTrackerProps) {
  const getStatusProgress = () => {
    switch (request.status) {
      case "pending":
        return 25
      case "requires-clarification":
        return 50
      case "approved":
        return 100
      case "rejected":
        return 100
      default:
        return 0
    }
  }

  const getStatusIcon = () => {
    switch (request.status) {
      case "pending":
        return <Clock className="h-5 w-5 text-amber-500" />
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "requires-clarification":
        return <AlertCircle className="h-5 w-5 text-blue-500" />
    }
  }

  const getStatusColor = () => {
    switch (request.status) {
      case "pending":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
      case "requires-clarification":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
    }
  }

  const getStatusMessage = () => {
    switch (request.status) {
      case "pending":
        return "Your veterinarian has been notified and will review your prescription request."
      case "approved":
        return "Your prescription has been approved! You can now order this therapeutic diet."
      case "rejected":
        return "Your prescription request was not approved. Please contact your veterinarian."
      case "requires-clarification":
        return "Your veterinarian needs additional information before approving this prescription."
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Prescription Verification Status</CardTitle>
          <Badge className={getStatusColor()}>
            {getStatusIcon()}
            <span className="ml-2 capitalize">{request.status.replace("-", " ")}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Verification Progress</span>
            <span>{getStatusProgress()}%</span>
          </div>
          <Progress value={getStatusProgress()} className="h-2" />
        </div>

        {/* Status Message */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm">{getStatusMessage()}</p>
        </div>

        {/* Request Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Prescription Diet</h4>
            <p className="text-sm text-muted-foreground">{request.prescriptionDietName}</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Patient</h4>
            <p className="text-sm text-muted-foreground">{request.dogName}</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Veterinarian</h4>
            <p className="text-sm text-muted-foreground">
              {request.vetInfo.name} - {request.vetInfo.clinic}
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Submitted</h4>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {request.submittedAt.toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Review Notes */}
        {request.reviewNotes && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Veterinarian Notes</h4>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm">{request.reviewNotes}</p>
            </div>
          </div>
        )}

        {/* Expiration Info */}
        {request.status === "approved" && request.expiresAt && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
              <CheckCircle className="h-4 w-4" />
              <span>Prescription valid until {request.expiresAt.toLocaleDateString()}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          {request.status === "pending" && onResendNotification && (
            <Button variant="outline" onClick={onResendNotification}>
              <Mail className="h-4 w-4 mr-2" />
              Resend Notification
            </Button>
          )}

          {request.prescriptionDetails.fileUrl && (
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Prescription
            </Button>
          )}

          {request.status === "requires-clarification" && (
            <Button>
              <Mail className="h-4 w-4 mr-2" />
              Contact Veterinarian
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
